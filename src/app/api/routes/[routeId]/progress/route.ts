import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { RouteProgress, Attendance } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';

function todayString() {
  return new Date().toISOString().split('T')[0];
}

/**
 * GET /api/routes/[routeId]/progress — Get today's progress for a route
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  const { error } = await requireRole('staff', 'supervisor', 'admin');
  if (error) return error;

  await connectDB();
  const { routeId } = await params;
  const today = todayString();

  let progress = await RouteProgress.findOne({ routeId, date: today });

  if (!progress) {
    // Calculate staffing snapshot
    const presentCount = await Attendance.countDocuments({
      routeId,
      date: today,
      status: 'verified',
    });

    progress = await RouteProgress.create({
      routeId,
      date: today,
      status: 'not_started',
      completionPercentage: 0,
      staffingSnapshot: { required: 0, present: presentCount, ratio: 0 },
    });
  }

  return NextResponse.json({ success: true, data: progress });
}

/**
 * PUT /api/routes/[routeId]/progress — Update route progress
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  const { session, error } = await requireRole('staff');
  if (error) return error;

  await connectDB();
  const { routeId } = await params;
  const today = todayString();
  const body = await req.json();
  const { completionPercentage, status, note } = body;

  let progress = await RouteProgress.findOne({ routeId, date: today });

  if (!progress) {
    progress = new RouteProgress({
      routeId,
      date: today,
      status: 'not_started',
      completionPercentage: 0,
    });
  }

  if (completionPercentage !== undefined) {
    progress.completionPercentage = Math.min(100, Math.max(0, completionPercentage));
  }

  if (status) {
    progress.status = status;
  }

  // Auto-set status based on percentage
  if (progress.completionPercentage > 0 && progress.status === 'not_started') {
    progress.status = 'in_progress';
  }
  if (progress.completionPercentage >= 100) {
    progress.status = 'completed';
  }

  progress.updates.push({
    time: new Date(),
    percentage: progress.completionPercentage,
    updatedBy: session!.user.id as any,
    note: note || undefined,
  });

  await progress.save();

  return NextResponse.json({ success: true, data: progress });
}
