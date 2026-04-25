/**
 * Operational KPI rollup engine.
 *
 * Answers a single question for ops leadership:
 *
 *   "What % of routes were finished by 10am / 12pm / 2pm IST today,
 *    and how is that trending over the last N days?"
 *
 * The "completion time" for a (route, date) pair is the **earliest**
 * RouteProgress.updates[] entry whose `percentage >= 100`. If a route
 * never hit 100 that day, it doesn't count toward any cutoff.
 *
 * Filtering:
 *   - by ward (Route.ward) — defaults to all
 *   - by lookback window in days
 *
 * Returns the per-day series (for sparkline / trend chart) plus rolled
 * totals so the dashboard can show a single percentage at a glance.
 */

import { RouteProgress, Route } from '../db/models';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Default cutoffs in IST hours. Picked to match BMC operational reviews. */
export const DEFAULT_CUTOFFS_IST = [10, 12, 14] as const;

export interface KpiDayRow {
  date: string;
  totalRoutes: number;
  completed: number;
  /** Map of cutoff hour → number of routes completed at or before that hour. */
  byCutoff: Record<number, number>;
}

export interface KpiRollup {
  ward: string | 'all';
  windowStart: string;
  windowEnd: string;
  cutoffs: readonly number[];
  series: KpiDayRow[];
  totals: {
    totalRouteDays: number;
    completedTotal: number;
    /** Map of cutoff hour → percentage of all route-days completed by that hour. */
    byCutoffPct: Record<number, number>;
  };
}

/** YYYY-MM-DD list, inclusive both ends. */
function dateRange(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  const start = new Date(startISO + 'T00:00:00.000Z');
  const end = new Date(endISO + 'T00:00:00.000Z');
  for (let d = start.getTime(); d <= end.getTime(); d += 86_400_000) {
    out.push(new Date(d).toISOString().split('T')[0]);
  }
  return out;
}

/** Convert a Date (UTC) to an IST hours-since-midnight float. */
function dateToISTHours(d: Date): number {
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  return ist.getUTCHours() + ist.getUTCMinutes() / 60;
}

/**
 * Find the earliest update where percentage hit 100. Returns Date or null.
 * Iterates updates in order — they may not be sorted by time in the schema,
 * so we sort defensively.
 */
function findCompletionTime(
  updates: { time: Date; percentage: number }[] | undefined
): Date | null {
  if (!updates || updates.length === 0) return null;
  const sorted = [...updates].sort((a, b) => a.time.getTime() - b.time.getTime());
  for (const u of sorted) {
    if (u.percentage >= 100) return u.time;
  }
  return null;
}

/** Compute the rollup over a window. */
export async function computeKpiRollup(opts: {
  windowStart: string;
  windowEnd: string;
  ward?: string | null;
  cutoffs?: readonly number[];
}): Promise<KpiRollup> {
  const cutoffs = opts.cutoffs ?? DEFAULT_CUTOFFS_IST;
  const ward = opts.ward ?? null;

  // Find which routes count toward the rollup.
  const routeQuery: Record<string, unknown> = {};
  if (ward) routeQuery.ward = ward;
  const routes = await Route.find(routeQuery).select('_id ward').lean();
  const routeIds = routes.map((r) => r._id);

  if (routeIds.length === 0) {
    const dates = dateRange(opts.windowStart, opts.windowEnd);
    return {
      ward: ward ?? 'all',
      windowStart: opts.windowStart,
      windowEnd: opts.windowEnd,
      cutoffs,
      series: dates.map((date) => ({
        date,
        totalRoutes: 0,
        completed: 0,
        byCutoff: Object.fromEntries(cutoffs.map((c) => [c, 0])),
      })),
      totals: {
        totalRouteDays: 0,
        completedTotal: 0,
        byCutoffPct: Object.fromEntries(cutoffs.map((c) => [c, 0])),
      },
    };
  }

  const progressRecords = await RouteProgress.find({
    routeId: { $in: routeIds },
    date: { $gte: opts.windowStart, $lte: opts.windowEnd },
  })
    .select('routeId date status updates completionPercentage updatedAt')
    .lean();

  // Build per-day buckets.
  const dates = dateRange(opts.windowStart, opts.windowEnd);
  const series: KpiDayRow[] = dates.map((date) => ({
    date,
    totalRoutes: routeIds.length, // every active route in scope is "expected" daily
    completed: 0,
    byCutoff: Object.fromEntries(cutoffs.map((c) => [c, 0])),
  }));

  const seriesByDate = new Map(series.map((row) => [row.date, row]));

  for (const p of progressRecords) {
    const row = seriesByDate.get(p.date);
    if (!row) continue;

    const completionTime =
      p.status === 'completed'
        ? findCompletionTime(p.updates) ?? p.updatedAt ?? null
        : null;

    if (completionTime) {
      row.completed += 1;
      const istHour = dateToISTHours(completionTime);
      for (const c of cutoffs) {
        if (istHour <= c) row.byCutoff[c] += 1;
      }
    }
  }

  // Roll up totals.
  const totalRouteDays = series.reduce((s, r) => s + r.totalRoutes, 0);
  const completedTotal = series.reduce((s, r) => s + r.completed, 0);
  const byCutoffPct: Record<number, number> = {};
  for (const c of cutoffs) {
    const cumulative = series.reduce((s, r) => s + r.byCutoff[c], 0);
    byCutoffPct[c] =
      totalRouteDays > 0 ? Math.round((cumulative / totalRouteDays) * 100) : 0;
  }

  return {
    ward: ward ?? 'all',
    windowStart: opts.windowStart,
    windowEnd: opts.windowEnd,
    cutoffs,
    series,
    totals: { totalRouteDays, completedTotal, byCutoffPct },
  };
}

/** Convert "days=N" query param to a YYYY-MM-DD window ending today (IST). */
export function windowFromDays(days: number, todayIST: string): { from: string; to: string } {
  const to = todayIST;
  const start = new Date(todayIST + 'T00:00:00.000Z');
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { from: start.toISOString().split('T')[0], to };
}
