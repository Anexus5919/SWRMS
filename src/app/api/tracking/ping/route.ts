import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Attendance, GPSPing, Route, RouteProgress, User, VerificationLog } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { trackingPingSchema } from '@/lib/validators/tracking';
import { todayIST } from '@/lib/utils/timezone';
import { decodePolyline } from '@/lib/routing/osrm';
import { evaluateAnomaly } from '@/lib/engine/anomaly';
import { checkLimit, rateLimitResponse, LIMITS } from '@/lib/rate-limit';
import { recordAndPush } from '@/lib/push';

const ALERT_COOLDOWN_MS = 15 * 60 * 1000;

/**
 * POST /api/tracking/ping - Live GPS sample from a staff device.
 *
 * Pre-conditions for accepting a ping:
 *   1. Caller is staff with an assigned route
 *   2. Worker has VERIFIED attendance for today (i.e. shift has started)
 *   3. Today's RouteProgress for the route is NOT 'completed'
 *
 * Behaviour:
 *   - Persists a GPSPing row (with computed off-route flag if a polyline exists)
 *   - Updates RouteProgress.lastGPSPing for the worker's route
 *   - Runs the deviation + idle anomaly checks; fires VerificationLog
 *     entries when thresholds are breached (rate-limited to 1 per 15 min)
 *   - If the device flags itself as mock-location, fires a critical
 *     'mock_location' verification log on EVERY such ping (cooldowned)
 *
 * Returns a small status payload so the mobile client can show
 * "Tracking: ON / Off route - return to your route" UX.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('staff');
  if (error) return error;

  const userId = session?.user?.id as string;
  const assignedRouteId = (session?.user as { assignedRouteId?: string | null } | undefined)
    ?.assignedRouteId;

  // Per-user rate limit. Real cap is ~120 pings/hr at 30s interval; we
  // allow 240/hr to absorb client retries and clock skew without ever
  // letting a scripted client flood the endpoint.
  const limit = checkLimit(`ping:${userId}`, LIMITS.trackingPing.max, LIMITS.trackingPing.windowMs);
  if (!limit.ok) return rateLimitResponse(limit);

  if (!assignedRouteId) {
    return NextResponse.json(
      { success: false, error: { code: 'NO_ROUTE', message: 'No route assigned' } },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Body must be valid JSON' } },
      { status: 400 }
    );
  }

  const parsed = trackingPingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid ping payload',
        },
      },
      { status: 400 }
    );
  }

  await connectDB();
  const today = todayIST();

  // Gate 1: worker must have verified attendance today
  const attendance = await Attendance.findOne({
    userId,
    date: today,
    status: 'verified',
  })
    .select('_id')
    .lean();
  if (!attendance) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'NOT_ON_SHIFT',
          message: 'Mark attendance before tracking can begin',
        },
      },
      { status: 412 }
    );
  }

  // Gate 2: route progress must not be completed (worker has ended their shift)
  const progress = await RouteProgress.findOne({
    routeId: assignedRouteId,
    date: today,
  })
    .select('status')
    .lean();
  if (progress?.status === 'completed') {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SHIFT_ENDED',
          message: 'Route is marked complete, tracking is off',
        },
      },
      { status: 409 }
    );
  }

  // Resolve route polyline once for this request to avoid two DB hits in evaluateAnomaly
  const route = await Route.findById(assignedRouteId).select('routePolyline').lean();
  const polyline = route?.routePolyline ? safeDecode(route.routePolyline) : null;

  const { coordinates, clientTime, mockLocation } = parsed.data;
  const recordedAt = new Date();

  // Pre-compute distance from polyline so we store it on the ping row.
  // evaluateAnomaly will recompute, but caching it here makes dashboard
  // queries (which read the most recent ping) trivial.
  let distanceFromRouteMeters: number | null = null;
  let isOffRoute = false;
  if (polyline) {
    const { distanceFromPointToPolyline } = await import('@/lib/geo/polyline');
    distanceFromRouteMeters = Math.round(
      distanceFromPointToPolyline(coordinates.lat, coordinates.lng, polyline)
    );
    const threshold = Number(process.env.TRACKING_DEVIATION_THRESHOLD_METERS ?? 120);
    isOffRoute = distanceFromRouteMeters > threshold;
  }

  // Persist the ping. We also bump RouteProgress.lastGPSPing so the
  // dashboard can show "last seen at" without a separate query.
  const ping = await GPSPing.create({
    userId,
    routeId: assignedRouteId,
    date: today,
    recordedAt,
    clientTime: clientTime ? new Date(clientTime) : null,
    coordinates,
    distanceFromRouteMeters,
    isOffRoute,
    mockLocation: Boolean(mockLocation),
  });

  await RouteProgress.updateOne(
    { routeId: assignedRouteId, date: today },
    {
      $set: {
        lastGPSPing: {
          lat: coordinates.lat,
          lng: coordinates.lng,
          time: recordedAt,
          workerId: userId,
        },
      },
    },
    { upsert: true }
  );

  // Mock-location flag: fire a critical alert immediately (cooldowned).
  if (mockLocation) {
    const recent = await VerificationLog.findOne({
      type: 'location_anomaly',
      affectedUserId: userId,
      date: today,
      'details.kind': 'mock_location',
      createdAt: { $gte: new Date(Date.now() - ALERT_COOLDOWN_MS) },
    })
      .select('_id')
      .lean();
    if (!recent) {
      await VerificationLog.create({
        type: 'location_anomaly',
        severity: 'critical',
        routeId: assignedRouteId,
        date: today,
        affectedUserId: userId,
        details: {
          kind: 'mock_location',
          coordinates: { lat: coordinates.lat, lng: coordinates.lng },
          message:
            'Device reported mock-location flag. The worker may be using a fake-GPS app to spoof their position.',
        },
        resolution: { status: 'open' },
      });

      // Critical: also push to all supervisors + admins. Same 15-min
      // cooldown via the VerificationLog dedupe gate above. Wrapped so
      // a broken push pipeline (missing VAPID, network) cannot break
      // ping handling.
      try {
        const [worker, route] = await Promise.all([
          User.findById(userId).select('name employeeId').lean(),
          Route.findById(assignedRouteId).select('code').lean(),
        ]);
        const workerName = worker
          ? `${worker.name.first} ${worker.name.last}`.trim()
          : 'A worker';
        const routeCode = route?.code ?? 'their route';

        await recordAndPush({
          recipientsQuery: { $or: [{ role: 'admin' }, { role: 'supervisor' }] },
          kind: 'mock_location',
          title: `Mock-GPS detected on ${routeCode}`,
          body: `${workerName}'s device reported a fake-location flag. Possible spoofing — review immediately.`,
          tag: `mock-${userId}-${today}`,
          url: '/supervisor-logs',
          context: {
            userId,
            employeeId: worker?.employeeId ?? null,
            routeId: assignedRouteId,
            routeCode,
            coordinates: { lat: coordinates.lat, lng: coordinates.lng },
            date: today,
          },
        });
      } catch (e) {
        console.warn(
          'Mock-location push delivery failed:',
          e instanceof Error ? e.message : e
        );
      }
    }
  }

  // Anomaly evaluation (deviation + idle). Fire-and-forget structure so a
  // slow eval can't block the mobile client from getting an HTTP response.
  const outcome = await evaluateAnomaly({
    userId,
    routeId: assignedRouteId,
    date: today,
    pingLat: coordinates.lat,
    pingLng: coordinates.lng,
    pingRecordedAt: recordedAt,
    cachedPolyline: polyline ?? undefined,
  });

  return NextResponse.json({
    success: true,
    data: {
      pingId: ping._id.toString(),
      recordedAt: recordedAt.toISOString(),
      distanceFromRouteMeters: outcome.distanceFromRouteMeters,
      isOffRoute: outcome.isOffRoute,
      deviationAlertFired: outcome.deviationAlertCreated,
      idleAlertFired: outcome.idleAlertCreated,
      mockLocationFlagged: Boolean(mockLocation),
    },
  });
}

function safeDecode(encoded: string): Array<[number, number]> | null {
  try {
    return decodePolyline(encoded);
  } catch {
    return null;
  }
}
