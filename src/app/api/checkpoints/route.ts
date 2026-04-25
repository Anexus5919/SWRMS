import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db/connection';
import { Checkpoint, Route } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { logAudit } from '@/lib/audit';

const createCheckpointSchema = z.object({
  code: z.string().min(1).max(200).regex(/^[A-Za-z0-9-_:.]+$/, 'Code may only contain alphanumerics and -_:.'),
  routeId: z.string().min(1),
  label: z.string().min(1).max(200),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  order: z.number().int().min(1).max(100),
});

/**
 * GET /api/checkpoints?routeId=...
 * - staff: list checkpoints for own assigned route
 * - supervisor/admin: list checkpoints for any route
 *
 * POST /api/checkpoints
 * - admin only: create a new checkpoint
 */
export async function GET(req: NextRequest) {
  const { session, error } = await requireRole('staff', 'supervisor', 'admin');
  if (error) return error;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const routeId = searchParams.get('routeId');

  if (!routeId) {
    return NextResponse.json(
      { success: false, error: { code: 'MISSING_ROUTE_ID', message: 'routeId query param required' } },
      { status: 400 }
    );
  }

  // Staff can only view checkpoints for their assigned route
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role === 'staff') {
    const assigned = (session?.user as { assignedRouteId?: string | null } | undefined)
      ?.assignedRouteId;
    if (!assigned || assigned !== routeId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Not your assigned route' } },
        { status: 403 }
      );
    }
  }

  const list = await Checkpoint.find({ routeId, isActive: true })
    .sort({ order: 1 })
    .lean();

  return NextResponse.json({ success: true, data: list });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('admin');
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Body must be valid JSON' } },
      { status: 400 }
    );
  }

  const parsed = createCheckpointSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid checkpoint payload',
        },
      },
      { status: 400 }
    );
  }

  await connectDB();

  const route = await Route.findById(parsed.data.routeId).select('code name ward').lean();
  if (!route) {
    return NextResponse.json(
      { success: false, error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found' } },
      { status: 404 }
    );
  }

  let checkpoint;
  try {
    checkpoint = await Checkpoint.create(parsed.data);
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DUPLICATE_CODE', message: 'A checkpoint with this code already exists.' },
        },
        { status: 409 }
      );
    }
    throw err;
  }

  await logAudit({
    action: 'route.updated',
    category: 'route',
    actorId: session?.user?.id as string | undefined,
    actorEmployeeId: (session?.user as { employeeId?: string } | undefined)?.employeeId,
    actorRole: 'admin',
    targetType: 'checkpoint',
    targetId: checkpoint._id.toString(),
    targetLabel: `${parsed.data.code} on ${route.code}`,
    metadata: {
      action: 'checkpoint_created',
      routeId: parsed.data.routeId,
      label: parsed.data.label,
      order: parsed.data.order,
    },
    ward: route.ward,
    req,
  });

  return NextResponse.json({ success: true, data: checkpoint }, { status: 201 });
}
