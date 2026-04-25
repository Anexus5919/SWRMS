import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { User, Route } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { todayIST } from '@/lib/utils/timezone';
import { computeReliabilityForUser, windowFromDays } from '@/lib/engine/reliability';

/**
 * GET /api/staff/reliability/[userId]?days=30
 *
 * Detailed per-day reliability trend for a single worker. Returns the
 * breakdown plus a daily series suitable for a sparkline / trend chart.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const { error, session } = await requireRole('supervisor', 'admin', 'staff');
  if (error) return error;

  const { userId } = await ctx.params;

  // Staff can only view their own report.
  if (session!.user.role === 'staff' && session!.user.id !== userId) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Cannot view another worker’s reliability.' } },
      { status: 403 }
    );
  }

  await connectDB();

  const user = await User.findById(userId).select('employeeId name ward assignedRouteId role').lean();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(req.url);
  const daysRaw = Number(searchParams.get('days') ?? '30');
  const days = Math.min(Math.max(Number.isFinite(daysRaw) ? daysRaw : 30, 1), 90);

  const { from, to } = windowFromDays(days, todayIST());
  const result = await computeReliabilityForUser(userId, from, to);

  const route = user.assignedRouteId
    ? await Route.findById(user.assignedRouteId).select('code name shiftStart').lean()
    : null;

  return NextResponse.json({
    success: true,
    data: {
      worker: {
        userId: user._id.toString(),
        employeeId: user.employeeId,
        name: `${user.name.first} ${user.name.last}`.trim(),
        ward: user.ward,
        route: route ? { code: route.code, name: route.name, shiftStart: route.shiftStart } : null,
      },
      score: result.score,
      rating: result.rating,
      breakdown: result.breakdown,
      daily: result.daily,
      windowStart: result.windowStart,
      windowEnd: result.windowEnd,
      days,
    },
  });
}
