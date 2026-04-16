import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Reallocation, User } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';

function todayString() {
  return new Date().toISOString().split('T')[0];
}

/**
 * POST /api/reallocation — Execute a reallocation (supervisor approves)
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('supervisor');
  if (error) return error;

  await connectDB();

  const body = await req.json();
  const { workerId, fromRouteId, toRouteId, distanceBetweenRoutes, previousStaffingRatio, newStaffingRatio } = body;

  if (!workerId || !fromRouteId || !toRouteId) {
    return NextResponse.json(
      { success: false, error: { code: 'MISSING_FIELDS', message: 'workerId, fromRouteId, toRouteId are required' } },
      { status: 400 }
    );
  }

  // Update worker's assigned route
  await User.findByIdAndUpdate(workerId, { assignedRouteId: toRouteId });

  // Create reallocation record
  const reallocation = await Reallocation.create({
    fromRouteId,
    toRouteId,
    workerId,
    supervisorId: session!.user.id,
    date: todayString(),
    reason: body.reason || 'understaffed',
    status: 'approved',
    distanceBetweenRoutes,
    previousStaffingRatio,
    newStaffingRatio,
  });

  return NextResponse.json({ success: true, data: reallocation });
}

/**
 * GET /api/reallocation — Get reallocation history
 */
export async function GET(req: NextRequest) {
  const { error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || todayString();

  const records = await Reallocation.find({ date })
    .populate('workerId', 'employeeId name')
    .populate('fromRouteId', 'name code')
    .populate('toRouteId', 'name code')
    .populate('supervisorId', 'employeeId name')
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ success: true, data: records });
}
