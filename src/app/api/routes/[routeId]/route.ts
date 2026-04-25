import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Route } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { updateRouteSchema } from '@/lib/validators/schemas';
import { logAudit } from '@/lib/audit';
import { snapRouteForPersistence } from '@/lib/routing/osrm';

/**
 * GET /api/routes/[routeId] - Get a single route
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  const { error } = await requireRole('staff', 'supervisor', 'admin');
  if (error) return error;

  await connectDB();
  const { routeId } = await params;

  const route = await Route.findById(routeId).lean();
  if (!route) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: route });
}

/**
 * Computes a field-level diff between the previous route document and the
 * patch the admin submitted. Used for govt-grade audit trail.
 */
function diffChanges(before: Record<string, unknown>, patch: Record<string, unknown>) {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(patch)) {
    const a = (before as Record<string, unknown>)[key];
    const b = patch[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      changes[key] = { from: a, to: b };
    }
  }
  return changes;
}

/**
 * PUT /api/routes/[routeId] - Update route (admin only).
 * Validates body against updateRouteSchema (whitelisted fields only) and
 * writes a tamper-evident audit log entry with field-level diff.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  const { session, error } = await requireRole('admin');
  if (error) return error;

  await connectDB();
  const { routeId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' } },
      { status: 400 }
    );
  }

  const parsed = updateRouteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid route update payload',
          issues: parsed.error.issues,
        },
      },
      { status: 400 }
    );
  }

  const before = await Route.findById(routeId).lean();
  if (!before) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } },
      { status: 404 }
    );
  }

  const update: Record<string, unknown> = { ...parsed.data };

  // Re-snap road polyline if any geometry-relevant field changed AND
  // the admin didn't explicitly supply a polyline in this request.
  const geometryChanged =
    parsed.data.startPoint !== undefined ||
    parsed.data.endPoint !== undefined ||
    parsed.data.waypoints !== undefined;

  if (geometryChanged && parsed.data.routePolyline === undefined) {
    const newStart = parsed.data.startPoint ?? before.startPoint;
    const newEnd = parsed.data.endPoint ?? before.endPoint;
    const newWaypoints = parsed.data.waypoints ?? before.waypoints ?? [];
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 6000);
      const snapped = await snapRouteForPersistence(
        newStart,
        newEnd,
        newWaypoints
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((w) => ({ lat: w.lat, lng: w.lng })),
        ctrl.signal,
      );
      clearTimeout(timeout);
      Object.assign(update, snapped);
    } catch (err) {
      console.warn(
        '[routes.update] OSRM re-snap failed, leaving previous polyline in place:',
        (err as Error).message,
      );
    }
  }

  const route = await Route.findByIdAndUpdate(
    routeId,
    update,
    { new: true, runValidators: true }
  ).lean();

  if (!route) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Route not found after update' } },
      { status: 404 }
    );
  }

  await logAudit({
    action: 'route.updated',
    category: 'route',
    actorId: session?.user?.id as string | undefined,
    actorEmployeeId: (session?.user as { employeeId?: string } | undefined)?.employeeId,
    actorRole: ((session?.user as { role?: 'admin' | 'supervisor' | 'staff' } | undefined)?.role) ?? 'admin',
    targetType: 'route',
    targetId: routeId,
    targetLabel: `${route.code} ${route.name}`,
    changes: diffChanges(before as unknown as Record<string, unknown>, parsed.data),
    ward: route.ward,
    req,
  });

  return NextResponse.json({ success: true, data: route });
}

/**
 * DELETE /api/routes/[routeId] - Soft-deactivate route (admin only).
 * Sets status='inactive'. Always writes an audit log entry.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  const { session, error } = await requireRole('admin');
  if (error) return error;

  await connectDB();
  const { routeId } = await params;

  const before = await Route.findById(routeId).lean();
  if (!before) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } },
      { status: 404 }
    );
  }

  const route = await Route.findByIdAndUpdate(
    routeId,
    { status: 'inactive' },
    { new: true }
  ).lean();

  if (!route) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Route not found after update' } },
      { status: 404 }
    );
  }

  await logAudit({
    action: 'route.status_changed',
    category: 'route',
    actorId: session?.user?.id as string | undefined,
    actorEmployeeId: (session?.user as { employeeId?: string } | undefined)?.employeeId,
    actorRole: ((session?.user as { role?: 'admin' | 'supervisor' | 'staff' } | undefined)?.role) ?? 'admin',
    targetType: 'route',
    targetId: routeId,
    targetLabel: `${route.code} ${route.name}`,
    changes: { status: { from: before.status, to: 'inactive' } },
    ward: route.ward,
    req,
  });

  return NextResponse.json({ success: true, data: route });
}
