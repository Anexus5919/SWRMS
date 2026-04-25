import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { requireRole } from '@/lib/auth/middleware';
import { todayIST } from '@/lib/utils/timezone';
import { computeKpiRollup, windowFromDays, DEFAULT_CUTOFFS_IST } from '@/lib/engine/kpi';

/**
 * GET /api/reports/kpi-rollup?days=14&ward=Chembur&cutoffs=10,12,14
 *
 * Ward-level KPI rollup: % of routes completed by 10am / 12pm / 2pm (IST)
 * over the last N days.
 */
export async function GET(req: NextRequest) {
  const { error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  await connectDB();

  const { searchParams } = new URL(req.url);

  const daysRaw = Number(searchParams.get('days') ?? '14');
  const days = Math.min(Math.max(Number.isFinite(daysRaw) ? daysRaw : 14, 1), 90);
  const ward = searchParams.get('ward');

  const cutoffsParam = searchParams.get('cutoffs');
  const cutoffs = cutoffsParam
    ? cutoffsParam
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n >= 0 && n <= 23)
    : DEFAULT_CUTOFFS_IST;

  const { from, to } = windowFromDays(days, todayIST());
  const rollup = await computeKpiRollup({
    windowStart: from,
    windowEnd: to,
    ward,
    cutoffs: cutoffs.length ? cutoffs : DEFAULT_CUTOFFS_IST,
  });

  return NextResponse.json({ success: true, data: rollup });
}
