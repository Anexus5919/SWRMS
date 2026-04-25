import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Route } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { snapRouteForPersistence, OSRMError } from '@/lib/routing/osrm';
import { logAudit } from '@/lib/audit';

/**
 * POST /api/routes/[routeId]/snap - Manually re-run OSRM road snapping for
 * a single route. Useful when:
 *   - OSRM was unreachable at create time and the route has no polyline
 *   - The map data was updated and the admin wants a fresh polyline
 *   - The previous snap was stale or visually wrong
 *
 * Admin only. Writes route.updated audit log on success.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  const { session, error } = await requireRole('admin');
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

  let snapped: Awaited<ReturnType<typeof snapRouteForPersistence>>;
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 10_000);
    snapped = await snapRouteForPersistence(
      route.startPoint,
      route.endPoint,
      (route.waypoints ?? [])
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((w) => ({ lat: w.lat, lng: w.lng })),
      ctrl.signal,
    );
    clearTimeout(timeout);
  } catch (err) {
    const code = err instanceof OSRMError ? err.code : 'OSRM_ERROR';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'OSRM_FAILED',
          message: `Routing service failed: ${(err as Error).message}`,
          osrmCode: code,
        },
      },
      { status: 502 }
    );
  }

  const updated = await Route.findByIdAndUpdate(
    routeId,
    snapped,
    { new: true }
  ).lean();

  await logAudit({
    action: 'route.updated',
    category: 'route',
    actorId: session?.user?.id as string | undefined,
    actorEmployeeId: (session?.user as { employeeId?: string } | undefined)?.employeeId,
    actorRole: 'admin',
    targetType: 'route',
    targetId: routeId,
    targetLabel: `${updated?.code} ${updated?.name}`,
    changes: {
      routePolyline: {
        from: route.routePolyline ? '[previous polyline]' : null,
        to: '[re-snapped via OSRM]',
      },
      routeDistanceKm: { from: route.routeDistanceKm ?? null, to: snapped.routeDistanceKm },
      routeDurationMinutes: {
        from: route.routeDurationMinutes ?? null,
        to: snapped.routeDurationMinutes,
      },
    },
    metadata: { manualResnap: true },
    ward: updated?.ward,
    req,
  });

  return NextResponse.json({ success: true, data: updated });
}
