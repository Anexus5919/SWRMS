import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Attendance, Route, User } from '@/lib/db/models';
import { verifyGeofence } from '@/lib/geo/geofence';
import { requireRole } from '@/lib/auth/middleware';

/**
 * POST /api/attendance/sync - Bulk sync offline attendance records
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('staff');
  if (error) return error;

  await connectDB();

  const body = await req.json();
  const { records } = body;

  if (!Array.isArray(records) || records.length === 0) {
    return NextResponse.json(
      { success: false, error: { code: 'NO_RECORDS', message: 'No records to sync' } },
      { status: 400 }
    );
  }

  const userId = session!.user.id;
  const user = await User.findById(userId);
  if (!user?.assignedRouteId) {
    return NextResponse.json(
      { success: false, error: { code: 'NO_ROUTE', message: 'No route assigned' } },
      { status: 400 }
    );
  }

  const route = await Route.findById(user.assignedRouteId);
  if (!route) {
    return NextResponse.json(
      { success: false, error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found' } },
      { status: 404 }
    );
  }

  const results = [];

  for (const record of records) {
    const date = record.timestamp
      ? new Date(record.timestamp).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Skip if already exists for that date
    const existing = await Attendance.findOne({ userId, date });
    if (existing) {
      results.push({ date, status: 'skipped', reason: 'Already recorded' });
      continue;
    }

    const geofenceResult = verifyGeofence(
      record.coordinates.lat,
      record.coordinates.lng,
      route.startPoint.lat,
      route.startPoint.lng,
      route.geofenceRadius
    );

    await Attendance.create({
      userId,
      routeId: route._id,
      date,
      checkInTime: new Date(record.timestamp),
      coordinates: record.coordinates,
      distanceFromRoute: geofenceResult.distance,
      status: geofenceResult.verified ? 'verified' : 'rejected',
      rejectionReason: geofenceResult.verified ? undefined : geofenceResult.message,
      deviceInfo: record.deviceInfo || {},
      isOfflineSync: true,
    });

    results.push({
      date,
      status: geofenceResult.verified ? 'verified' : 'rejected',
      distance: geofenceResult.distance,
    });
  }

  return NextResponse.json({ success: true, data: { synced: results } });
}
