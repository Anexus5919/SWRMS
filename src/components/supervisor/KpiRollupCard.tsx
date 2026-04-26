'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';

interface KpiSeriesRow {
  date: string;
  totalRoutes: number;
  completed: number;
  byCutoff: Record<string, number>;
}

interface KpiRollup {
  ward: string;
  windowStart: string;
  windowEnd: string;
  cutoffs: number[];
  series: KpiSeriesRow[];
  totals: {
    totalRouteDays: number;
    completedTotal: number;
    byCutoffPct: Record<string, number>;
  };
}

const cutoffLabel = (h: number): string => {
  if (h === 0) return 'Midnight';
  if (h === 12) return '12 PM';
  if (h < 12) return `${h} AM`;
  return `${h - 12} PM`;
};

/**
 * Compact KPI rollup card for the supervisor dashboard.
 *
 * Shows three percentages - % of routes completed by 10am / 12pm / 2pm
 * over the last 14 days - with a tiny per-day sparkline next to each.
 * Click "View report" to see the full breakdown on the reports page.
 */
export default function KpiRollupCard({ days = 14 }: { days?: number }) {
  const [data, setData] = useState<KpiRollup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reports/kpi-rollup?days=${days}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success) setData(json.data);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [days]);

  if (loading) {
    return (
      <Card className="p-4 mb-6 animate-pulse">
        <div className="h-4 w-1/3 bg-[var(--neutral-200)] rounded mb-3" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-12 bg-[var(--neutral-100)] rounded" />
          <div className="h-12 bg-[var(--neutral-100)] rounded" />
          <div className="h-12 bg-[var(--neutral-100)] rounded" />
        </div>
      </Card>
    );
  }

  if (!data || data.totals.totalRouteDays === 0) return null;

  return (
    <Card className="p-4 mb-6" statusBorder="gold">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)]">
            Operational KPIs · {data.windowStart} → {data.windowEnd}
          </p>
          <p className="text-sm font-semibold text-[var(--neutral-800)] mt-0.5">
            Routes completed by cutoff time
          </p>
        </div>
        <Link
          href="/reports"
          className="text-xs font-medium text-bmc-700 hover:text-bmc-900 underline"
        >
          View report
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {data.cutoffs.map((c) => {
          const pct = data.totals.byCutoffPct[String(c)] ?? data.totals.byCutoffPct[c] ?? 0;
          const tone = pct >= 75 ? 'green' : pct >= 50 ? 'amber' : 'red';
          const toneClass =
            tone === 'green'
              ? 'text-status-green'
              : tone === 'amber'
                ? 'text-status-amber-dark'
                : 'text-status-red';
          return (
            <div
              key={c}
              className="px-3 py-3 rounded border border-[var(--border)] bg-white"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] uppercase tracking-wider text-[var(--neutral-500)]">
                  By {cutoffLabel(c)}
                </span>
                <span className={`font-display font-bold text-2xl ${toneClass}`}>
                  {pct}%
                </span>
              </div>
              <Sparkline series={data.series} cutoff={c} tone={tone} />
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-[var(--neutral-500)] mt-2.5">
        Across {data.totals.totalRouteDays} route-days, {data.totals.completedTotal} reached 100% completion.
      </p>
    </Card>
  );
}

function Sparkline({
  series,
  cutoff,
  tone,
}: {
  series: KpiSeriesRow[];
  cutoff: number;
  tone: 'green' | 'amber' | 'red';
}) {
  const color =
    tone === 'green' ? '#15803d' : tone === 'amber' ? '#b45309' : '#b91c1c';
  return (
    <div className="flex items-end gap-[2px] h-7 mt-2">
      {series.map((row) => {
        const total = row.totalRoutes;
        const hit = row.byCutoff[String(cutoff)] ?? row.byCutoff[cutoff] ?? 0;
        const pct = total > 0 ? hit / total : 0;
        const h = Math.max(pct * 100, 4);
        return (
          <div
            key={row.date}
            title={`${row.date}: ${hit}/${total} (${Math.round(pct * 100)}%)`}
            className="flex-1 rounded-sm"
            style={{ height: `${h}%`, background: color, opacity: 0.5 + pct * 0.5, minHeight: '3px' }}
          />
        );
      })}
    </div>
  );
}
