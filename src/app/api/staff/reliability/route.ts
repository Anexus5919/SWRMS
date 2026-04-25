import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { User, Route } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { todayIST } from '@/lib/utils/timezone';
import { computeReliabilityForCohort, windowFromDays } from '@/lib/engine/reliability';

/**
 * GET /api/staff/reliability?days=30&ward=Chembur
 *
 * Returns workforce-wide reliability scores for the given window.
 * Sorted ascending — worst scores first so supervisors see attention
 * cases at the top of the list.
 *
 * Query:
 *   days  — lookback window in days (default 30, max 90)
 *   ward  — optional ward filter (matches User.ward)
 *   role  — defaults to 'staff'; only staff are scored
 */
export async function GET(req: NextRequest) {
  const { error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const daysRaw = Number(searchParams.get('days') ?? '30');
  const days = Math.min(Math.max(Number.isFinite(daysRaw) ? daysRaw : 30, 1), 90);
  const ward = searchParams.get('ward');

  const userQuery: Record<string, unknown> = { role: 'staff', isActive: true };
  if (ward) userQuery.ward = ward;

  const users = await User.find(userQuery)
    .select('_id employeeId name ward assignedRouteId')
    .lean();

  if (users.length === 0) {
    return NextResponse.json({
      success: true,
      data: { workers: [], windowStart: '', windowEnd: '', days },
    });
  }

  const { from, to } = windowFromDays(days, todayIST());

  // Resolve route codes once so the table can show them inline.
  const routeIds = users
    .map((u) => u.assignedRouteId)
    .filter((id): id is NonNullable<typeof id> => !!id);
  const routes = routeIds.length
    ? await Route.find({ _id: { $in: routeIds } }).select('_id code name').lean()
    : [];
  const routeById = new Map(routes.map((r) => [r._id.toString(), r]));

  const results = await computeReliabilityForCohort(
    users.map((u) => u._id.toString()),
    from,
    to
  );

  const byUserId = new Map(results.map((r) => [r.userId, r]));

  const workers = users
    .map((u) => {
      const r = byUserId.get(u._id.toString());
      const route = u.assignedRouteId ? routeById.get(u.assignedRouteId.toString()) : null;
      return {
        userId: u._id.toString(),
        employeeId: u.employeeId,
        name: `${u.name.first} ${u.name.last}`.trim(),
        ward: u.ward,
        route: route ? { code: route.code, name: route.name } : null,
        score: r?.score ?? 100,
        rating: r?.rating ?? 'excellent',
        breakdown: r?.breakdown ?? null,
      };
    })
    .sort((a, b) => a.score - b.score); // worst first

  return NextResponse.json({
    success: true,
    data: { workers, windowStart: from, windowEnd: to, days },
  });
}
