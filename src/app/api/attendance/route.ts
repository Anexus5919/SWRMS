import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Attendance, Route, User, VerificationLog, Unavailability } from '@/lib/db/models';
import { verifyGeofence } from '@/lib/geo/geofence';
import { requireRole } from '@/lib/auth/middleware';
import { markAttendanceSchema } from '@/lib/validators/schemas';
import { todayIST } from '@/lib/utils/timezone';
import { checkLimit, rateLimitResponse, LIMITS } from '@/lib/rate-limit';
import { notifyAboutWorker } from '@/lib/push';

const CLOCK_DRIFT_WARNING_SECONDS = 300; // 5 minutes

/**
 * POST /api/attendance - Mark geo-fenced attendance
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('staff');
  if (error) return error;

  // Per-user rate limit AFTER auth so an unauthenticated attacker
  // can't burn a legit user's quota by spamming.
  const limit = checkLimit(`attendance:${session!.user.id}`, LIMITS.attendance.max, LIMITS.attendance.windowMs);
  if (!limit.ok) return rateLimitResponse(limit);

  await connectDB();

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = markAttendanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { coordinates, deviceInfo, mockLocation, clientTime } = parsed.data;
  // `attempts` is not part of the validated schema but may be sent by the client
  const rawCoords = (body as Record<string, unknown>).coordinates;
  const attempts =
    rawCoords && typeof (rawCoords as Record<string, unknown>).attempts === 'number'
      ? ((rawCoords as Record<string, unknown>).attempts as number)
      : 1;

  const userId = session!.user.id;
  const today = todayIST();

  // ── Anti-fraud gate 1: mock-location flag ────────────────────────
  // Reject the attendance entirely. Worker would have had to enable
  // a fake-GPS app and grant it permissions to set this flag, so we
  // treat it as a clear policy violation.
  if (mockLocation) {
    const userForLog = await User.findById(userId).select('assignedRouteId').lean();
    if (userForLog?.assignedRouteId) {
      await VerificationLog.create({
        type: 'location_anomaly',
        severity: 'critical',
        routeId: userForLog.assignedRouteId,
        date: today,
        affectedUserId: userId,
        details: {
          kind: 'mock_location',
          coordinates: { lat: coordinates.lat, lng: coordinates.lng },
          message:
            'Attendance rejected: device reported mock-location (fake GPS app suspected).',
        },
        resolution: { status: 'open' },
      });
    }
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MOCK_LOCATION_REJECTED',
          message:
            'Mock-location detected. Attendance cannot be marked. If you have a fake-GPS app installed, please remove it and try again.',
        },
      },
      { status: 403 }
    );
  }

  // Check if already checked in today
  const existing = await Attendance.findOne({ userId, date: today });
  if (existing) {
    return NextResponse.json(
      { success: false, error: { code: 'ALREADY_CHECKED_IN', message: 'Attendance already marked for today' } },
      { status: 409 }
    );
  }

  // Check if worker self-declared unavailable today
  const unavailable = await Unavailability.findOne({ userId, date: today }).select('reason').lean();
  if (unavailable) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DECLARED_UNAVAILABLE',
          message:
            'You declared yourself unavailable today and cannot mark attendance. Contact your supervisor if you returned to work.',
        },
      },
      { status: 409 }
    );
  }

  // Get user's assigned route
  const user = await User.findById(userId);
  if (!user?.assignedRouteId) {
    return NextResponse.json(
      { success: false, error: { code: 'NO_ROUTE', message: 'No route assigned to this worker' } },
      { status: 400 }
    );
  }

  const route = await Route.findById(user.assignedRouteId);
  if (!route) {
    return NextResponse.json(
      { success: false, error: { code: 'ROUTE_NOT_FOUND', message: 'Assigned route not found' } },
      { status: 404 }
    );
  }

  // Verify geofence
  const serverNow = new Date();
  const geofenceResult = verifyGeofence(
    coordinates.lat,
    coordinates.lng,
    route.startPoint.lat,
    route.startPoint.lng,
    route.geofenceRadius
  );

  // ── Anti-fraud gate 2: clock drift detection ─────────────────────
  // Don't reject - workers may legitimately have wrong clocks - but log
  // a warning so supervisors can investigate suspicious cases (e.g. a
  // worker faking attendance during off-hours by skewing device time).
  let clockDriftSeconds: number | null = null;
  if (clientTime) {
    const drift = Math.abs(serverNow.getTime() - new Date(clientTime).getTime()) / 1000;
    clockDriftSeconds = Math.round(drift);
    if (drift > CLOCK_DRIFT_WARNING_SECONDS) {
      await VerificationLog.create({
        type: 'location_anomaly',
        severity: 'warning',
        routeId: route._id,
        date: today,
        affectedUserId: userId,
        details: {
          kind: 'mock_location', // re-use kind enum; specific cause goes in message
          coordinates: { lat: coordinates.lat, lng: coordinates.lng },
          message: `Device clock differs from server clock by ${Math.round(drift)} seconds. Possible time tampering.`,
        },
        resolution: { status: 'open' },
      });
    }
  }

  const attendance = await Attendance.create({
    userId,
    routeId: route._id,
    date: today,
    checkInTime: serverNow,
    coordinates: {
      lat: coordinates.lat,
      lng: coordinates.lng,
      accuracy: coordinates.accuracy ?? undefined,
    },
    distanceFromRoute: geofenceResult.distance,
    status: geofenceResult.verified ? 'verified' : 'rejected',
    rejectionReason: geofenceResult.verified ? undefined : geofenceResult.message,
    attempts,
    deviceInfo: deviceInfo || {},
    mockLocation: false,
    clockDriftSeconds,
    isOfflineSync: false,
  });

  // Inbox + push for supervisor/admin so they see live shift starts.
  // Verified attendance is a "good news" event - tag is per-worker so a
  // re-attempt on the same day replaces the prior notification at the OS.
  if (geofenceResult.verified) {
    await notifyAboutWorker({
      workerId: userId,
      routeId: route._id,
      kind: 'attendance_marked',
      tag: `attn-${userId}-${today}`,
      url: '/attendance-log',
      template: (name, code) => ({
        title: `${name} on duty (${code})`,
        body: `Verified attendance at ${serverNow.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        })} · ${Math.round(geofenceResult.distance)}m from start point.`,
      }),
      contextExtras: {
        date: today,
        distanceMeters: Math.round(geofenceResult.distance),
        attempts,
      },
    });
  } else {
    // Rejected attendance (geofence fail) - escalate to sup/admin so they
    // can investigate before the worker walks off thinking they're checked in.
    await notifyAboutWorker({
      workerId: userId,
      routeId: route._id,
      kind: 'attendance_face_flag', // re-using kind for "manual review needed"
      tag: `attn-rej-${userId}-${today}`,
      url: '/attendance-log',
      template: (name, code) => ({
        title: `${name} attendance rejected (${code})`,
        body: `${Math.round(geofenceResult.distance)}m from route start (limit ${
          route.geofenceRadius
        }m). Worker may need help locating start point.`,
      }),
      contextExtras: {
        date: today,
        distanceMeters: Math.round(geofenceResult.distance),
        thresholdMeters: route.geofenceRadius,
        rejectionReason: geofenceResult.message,
      },
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: attendance._id,
      status: attendance.status,
      distance: geofenceResult.distance,
      message: geofenceResult.message,
      verified: geofenceResult.verified,
      routeName: route.name,
      routeCode: route.code,
      checkInTime: attendance.checkInTime,
      clockDriftSeconds,
    },
  });
}

/**
 * GET /api/attendance - List attendance records (for supervisor)
 */
export async function GET(req: NextRequest) {
  const { session, error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || todayIST();
  const routeId = searchParams.get('routeId');

  const filter: Record<string, unknown> = { date };
  if (routeId) filter.routeId = routeId;

  const records = await Attendance.find(filter)
    .populate('userId', 'employeeId name')
    .populate('routeId', 'name code')
    .sort({ checkInTime: -1 })
    .lean();

  return NextResponse.json({ success: true, data: records });
}
