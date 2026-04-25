import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Route } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { createRouteSchema } from '@/lib/validators/schemas';
import { snapRouteForPersistence } from '@/lib/routing/osrm';
import { logAudit } from '@/lib/audit';

/**
 * GET /api/routes - List all routes
 */
export async function GET() {
  const { error } = await requireRole('staff', 'supervisor', 'admin');
  if (error) return error;

  await connectDB();

  const routes = await Route.find({ status: 'active' })
    .sort({ code: 1 })
    .lean();

  return NextResponse.json({ success: true, data: routes });
}

/**
 * POST /api/routes - Create a new route (admin only).
 * Best-effort road-snapping via OSRM. If OSRM is unreachable / errors out,
 * the route is still created without a polyline and an admin can re-snap
 * later via /api/routes/[routeId]/snap.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('admin');
  if (error) return error;

  await connectDB();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = createRouteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const data = { ...parsed.data };

  // If the admin didn't already supply a polyline, try to compute one.
  // 6s timeout - if OSRM is slow or down we don't want to block route creation.
  if (!data.routePolyline) {
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 6000);
      const snapped = await snapRouteForPersistence(
        data.startPoint,
        data.endPoint,
        (data.waypoints ?? [])
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((w) => ({ lat: w.lat, lng: w.lng })),
        ctrl.signal,
      );
      clearTimeout(timeout);
      Object.assign(data, snapped);
    } catch (err) {
      console.warn(
        '[routes.create] OSRM snap failed, route will be created without polyline:',
        (err as Error).message,
      );
    }
  }

  const route = await Route.create(data);

  await logAudit({
    action: 'route.created',
    category: 'route',
    actorId: session?.user?.id as string | undefined,
    actorEmployeeId: (session?.user as { employeeId?: string } | undefined)?.employeeId,
    actorRole: 'admin',
    targetType: 'route',
    targetId: route._id.toString(),
    targetLabel: `${route.code} ${route.name}`,
    metadata: {
      routePolylineSnapped: Boolean(data.routePolyline),
    },
    ward: route.ward,
    req,
  });

  return NextResponse.json({ success: true, data: route }, { status: 201 });
}
