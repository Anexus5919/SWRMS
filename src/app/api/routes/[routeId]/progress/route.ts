import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { RouteProgress, Attendance, Route } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { todayIST } from '@/lib/utils/timezone';

/**
 * GET /api/routes/[routeId]/progress — Get today's progress for a route
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  const { error } = await requireRole('staff', 'supervisor', 'admin');
  if (error) return error;

  try {
    await connectDB();
    const { routeId } = await params;
    const today = todayIST();

    let progress = await RouteProgress.findOne({ routeId, date: today });

    if (!progress) {
      const route = await Route.findById(routeId).lean();
      const requiredStaff = route?.requiredStaff ?? 0;

      const presentCount = await Attendance.countDocuments({
        routeId,
        date: today,
        status: 'verified',
      });

      const ratio = requiredStaff > 0 ? Math.round((presentCount / requiredStaff) * 100) / 100 : 0;

      progress = await RouteProgress.create({
        routeId,
        date: today,
        status: 'not_started',
        completionPercentage: 0,
        staffingSnapshot: { required: requiredStaff, present: presentCount, ratio },
      });
    }

    return NextResponse.json({ success: true, data: progress });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch progress' } },
      { status: 500 }
    );
  }
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

  try {
    await connectDB();
    const { routeId } = await params;

    // Ownership check: staff can only update their assigned route
    if (session!.user.assignedRouteId?.toString() !== routeId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You can only update your assigned route' } },
        { status: 403 }
      );
    }

    const today = todayIST();
    const body = await req.json();
    const { completionPercentage, note } = body;

    const VALID_STATUSES = ['not_started', 'in_progress', 'completed', 'stalled'];

    let progress = await RouteProgress.findOne({ routeId, date: today });

    if (!progress) {
      const route = await Route.findById(routeId).lean();
      progress = new RouteProgress({
        routeId,
        date: today,
        status: 'not_started',
        completionPercentage: 0,
        staffingSnapshot: {
          required: route?.requiredStaff ?? 0,
          present: 0,
          ratio: 0,
        },
      });
    }

    if (completionPercentage !== undefined) {
      const pct = Number(completionPercentage);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_INPUT', message: 'completionPercentage must be 0-100' } },
          { status: 400 }
        );
      }
      progress.completionPercentage = Math.min(100, Math.max(0, pct));
    }

    // Auto-set status based on percentage (no manual status override for staff)
    if (progress.completionPercentage >= 100) {
      progress.status = 'completed';
    } else if (progress.completionPercentage > 0) {
      progress.status = 'in_progress';
    }

    // Allow stalled status to be set explicitly by staff
    if (body.status === 'stalled' && VALID_STATUSES.includes(body.status)) {
      progress.status = 'stalled';
    }

    progress.updates.push({
      time: new Date(),
      percentage: progress.completionPercentage,
      updatedBy: session!.user.id as any,
      note: note || undefined,
    });

    await progress.save();

    return NextResponse.json({ success: true, data: progress });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update progress' } },
      { status: 500 }
    );
  }
}
