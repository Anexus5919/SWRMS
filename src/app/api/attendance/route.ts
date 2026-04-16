import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Attendance, Route, User } from '@/lib/db/models';
import { verifyGeofence } from '@/lib/geo/geofence';
import { requireRole } from '@/lib/auth/middleware';

function todayString() {
  return new Date().toISOString().split('T')[0];
}

/**
 * POST /api/attendance — Mark geo-fenced attendance
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('staff');
  if (error) return error;

  await connectDB();

  const body = await req.json();
  const { coordinates, deviceInfo } = body;

  if (!coordinates?.lat || !coordinates?.lng) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_COORDINATES', message: 'GPS coordinates are required' } },
      { status: 400 }
    );
  }

  const userId = session!.user.id;
  const today = todayString();

  // Check if already checked in today
  const existing = await Attendance.findOne({ userId, date: today });
  if (existing) {
    return NextResponse.json(
      { success: false, error: { code: 'ALREADY_CHECKED_IN', message: 'Attendance already marked for today' } },
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
  const geofenceResult = verifyGeofence(
    coordinates.lat,
    coordinates.lng,
    route.startPoint.lat,
    route.startPoint.lng,
    route.geofenceRadius
  );

  const attendance = await Attendance.create({
    userId,
    routeId: route._id,
    date: today,
    checkInTime: new Date(),
    coordinates: {
      lat: coordinates.lat,
      lng: coordinates.lng,
      accuracy: coordinates.accuracy || null,
    },
    distanceFromRoute: geofenceResult.distance,
    status: geofenceResult.verified ? 'verified' : 'rejected',
    rejectionReason: geofenceResult.verified ? undefined : geofenceResult.message,
    attempts: coordinates.attempts || 1,
    deviceInfo: deviceInfo || {},
    isOfflineSync: false,
  });

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
    },
  });
}

/**
 * GET /api/attendance — List attendance records (for supervisor)
 */
export async function GET(req: NextRequest) {
  const { session, error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || todayString();
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
