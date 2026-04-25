import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db/connection';
import { GPSPing, User, Route } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { todayIST } from '@/lib/utils/timezone';

/**
 * GET /api/tracking/replay
 *
 * Two modes:
 *
 *   ?date=YYYY-MM-DD                 → list of workers with pings that day
 *   ?date=YYYY-MM-DD&userId=...      → full ordered ping series for that worker
 *
 * Used by the supervisor "GPS Replay" page to scrub through any worker's
 * historical movements.
 *
 * Auth: supervisor or admin only — staff cannot replay other workers.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const { error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || todayIST();
  const userId = searchParams.get('userId');

  if (!DATE_RE.test(date)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_DATE', message: 'Date must be YYYY-MM-DD.' } },
      { status: 400 }
    );
  }

  if (!userId) {
    // List workers with pings on this date.
    const grouped = await GPSPing.aggregate([
      { $match: { date } },
      {
        $group: {
          _id: '$userId',
          routeId: { $first: '$routeId' },
          pingCount: { $sum: 1 },
          firstPing: { $min: '$recordedAt' },
          lastPing: { $max: '$recordedAt' },
          offRoutePings: { $sum: { $cond: ['$isOffRoute', 1, 0] } },
        },
      },
      { $sort: { pingCount: -1 } },
    ]);

    if (grouped.length === 0) {
      return NextResponse.json({ success: true, data: { date, workers: [] } });
    }

    const userIds = grouped.map((g) => g._id);
    const routeIds = grouped.map((g) => g.routeId).filter(Boolean);

    const [users, routes] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select('employeeId name ward').lean(),
      routeIds.length ? Route.find({ _id: { $in: routeIds } }).select('code name').lean() : [],
    ]);
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    const routeMap = new Map(routes.map((r) => [r._id.toString(), r]));

    const workers = grouped.map((g) => {
      const u = userMap.get(g._id.toString());
      const r = g.routeId ? routeMap.get(g.routeId.toString()) : null;
      return {
        userId: g._id.toString(),
        employeeId: u?.employeeId ?? '?',
        name: u ? `${u.name.first} ${u.name.last}`.trim() : 'Unknown',
        ward: u?.ward ?? null,
        route: r ? { code: r.code, name: r.name } : null,
        pingCount: g.pingCount,
        offRoutePings: g.offRoutePings,
        firstPing: g.firstPing,
        lastPing: g.lastPing,
      };
    });

    return NextResponse.json({ success: true, data: { date, workers } });
  }

  // Single-worker replay series.
  if (!Types.ObjectId.isValid(userId)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_USER', message: 'Invalid user id.' } },
      { status: 400 }
    );
  }

  const [user, pings] = await Promise.all([
    User.findById(userId).select('employeeId name ward assignedRouteId').lean(),
    GPSPing.find({ userId: new Types.ObjectId(userId), date })
      .sort({ recordedAt: 1 })
      .select('coordinates recordedAt isOffRoute distanceFromRouteMeters mockLocation routeId')
      .lean(),
  ]);

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } },
      { status: 404 }
    );
  }

  // Resolve the route from the first ping (or assigned route).
  const routeId = pings[0]?.routeId ?? user.assignedRouteId;
  const route = routeId
    ? await Route.findById(routeId)
        .select('code name shiftStart shiftEnd routePolyline startPoint endPoint geofenceRadius')
        .lean()
    : null;

  return NextResponse.json({
    success: true,
    data: {
      date,
      worker: {
        userId: user._id.toString(),
        employeeId: user.employeeId,
        name: `${user.name.first} ${user.name.last}`.trim(),
        ward: user.ward,
      },
      route: route
        ? {
            _id: route._id.toString(),
            code: route.code,
            name: route.name,
            shiftStart: route.shiftStart,
            shiftEnd: route.shiftEnd,
            routePolyline: route.routePolyline ?? null,
            startPoint: route.startPoint,
            endPoint: route.endPoint,
            geofenceRadius: route.geofenceRadius,
          }
        : null,
      pings: pings.map((p) => ({
        recordedAt: p.recordedAt,
        lat: p.coordinates.lat,
        lng: p.coordinates.lng,
        accuracy: p.coordinates.accuracy ?? null,
        isOffRoute: !!p.isOffRoute,
        distanceFromRouteMeters: p.distanceFromRouteMeters ?? null,
        mockLocation: !!p.mockLocation,
      })),
    },
  });
}
