'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Badge,
  Breadcrumbs,
  Button,
  Card,
  EmptyState,
  SkeletonRow,
} from '@/components/ui';

type Rating = 'excellent' | 'good' | 'fair' | 'poor';

interface WorkerRow {
  userId: string;
  employeeId: string;
  name: string;
  ward: string;
  route: { code: string; name: string } | null;
  score: number;
  rating: Rating;
  breakdown: {
    daysAnalyzed: number;
    daysScheduled: number;
    daysAttended: number;
    daysMissed: number;
    lateArrivals: number;
    rejectedAttendance: number;
    routeDeviationAlerts: number;
    idleAlerts: number;
    mockLocationFlags: number;
    faceMismatches: number;
    unavailabilityDays: number;
  } | null;
}

interface DailyEntry {
  date: string;
  scheduled: boolean;
  attended: boolean;
  score: number;
  events: {
    missed: boolean;
    rejected: boolean;
    late: boolean;
    routeDeviationAlerts: number;
    idleAlerts: number;
    mockLocationFlags: number;
    faceMismatches: number;
    unavailability: string | null;
  };
}

interface DetailData {
  worker: WorkerRow;
  score: number;
  rating: Rating;
  breakdown: WorkerRow['breakdown'];
  daily: DailyEntry[];
  windowStart: string;
  windowEnd: string;
  days: number;
}

const ratingToBadge: Record<Rating, 'green' | 'amber' | 'red' | 'neutral'> = {
  excellent: 'green',
  good: 'green',
  fair: 'amber',
  poor: 'red',
};

const ratingLabel: Record<Rating, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

function scoreColor(score: number): string {
  if (score >= 90) return 'text-status-green';
  if (score >= 75) return 'text-bmc-700';
  if (score >= 60) return 'text-status-amber-dark';
  return 'text-status-red';
}

export default function ReliabilityPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<{
    workers: WorkerRow[];
    windowStart: string;
    windowEnd: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | Rating>('all');
  const [openWorkerId, setOpenWorkerId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/reliability?days=${days}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.workers.filter((w) => {
      if (ratingFilter !== 'all' && w.rating !== ratingFilter) return false;
      if (!q) return true;
      return (
        w.name.toLowerCase().includes(q) ||
        w.employeeId.toLowerCase().includes(q) ||
        w.route?.code.toLowerCase().includes(q)
      );
    });
  }, [data, search, ratingFilter]);

  const counts = useMemo(() => {
    if (!data) return { excellent: 0, good: 0, fair: 0, poor: 0 };
    return data.workers.reduce(
      (acc, w) => ({ ...acc, [w.rating]: (acc[w.rating as Rating] ?? 0) + 1 }),
      { excellent: 0, good: 0, fair: 0, poor: 0 } as Record<Rating, number>
    );
  }, [data]);

  return (
    <div>
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Reliability' }]}
        className="mb-4"
      />
      <div className="flex items-start justify-between flex-wrap gap-4 mb-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-bmc-700">
            Workforce Quality
          </p>
          <h1 className="font-display text-3xl font-bold text-[var(--neutral-900)] mt-1">
            Reliability Scores
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Cumulative score per worker over the last {days} days. Worst performers first.
          </p>
          <div className="divider-gold w-24 my-4" />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-1.5 text-xs rounded border border-[var(--border)] bg-white"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button variant="ghost" size="sm" onClick={fetchData}>Refresh</Button>
        </div>
      </div>

      {/* Rating distribution strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {(['excellent', 'good', 'fair', 'poor'] as Rating[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRatingFilter(ratingFilter === r ? 'all' : r)}
            className={`text-left ${ratingFilter === r ? 'ring-2 ring-bmc-500' : ''}`}
          >
            <Card statusBorder={ratingToBadge[r] === 'neutral' ? 'amber' : ratingToBadge[r]} className="px-4 py-3">
              <p className="text-[10px] text-[var(--neutral-500)] uppercase tracking-wider">{ratingLabel[r]}</p>
              <p className="text-xl font-bold text-[var(--neutral-800)] mt-0.5 font-display">
                {counts[r]}
              </p>
              <p className="text-[10px] text-[var(--neutral-400)]">workers</p>
            </Card>
          </button>
        ))}
      </div>

      {/* Filter strip */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <input
          type="search"
          placeholder="Search by name, employee ID, or route code"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 text-sm rounded border border-[var(--border)] bg-white w-full sm:w-80"
        />
        <p className="text-xs text-[var(--neutral-500)]">
          Showing {filtered.length} of {data?.workers.length ?? 0}
          {data ? ` · ${data.windowStart} → ${data.windowEnd}` : ''}
        </p>
      </div>

      {loading ? (
        <Card>
          <div className="space-y-2 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        </Card>
      ) : !data || data.workers.length === 0 ? (
        <Card>
          <EmptyState
            title="No active staff to score"
            description="Once active staff start checking in, their reliability scores will appear here."
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="No workers match your filters"
            description="Try clearing the search or rating filter."
            action={
              <Button variant="ghost" onClick={() => { setSearch(''); setRatingFilter('all'); }}>
                Clear filters
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-[var(--neutral-500)]">Worker</th>
                <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-[var(--neutral-500)]">Route</th>
                <th className="text-right px-3 py-2 text-[10px] uppercase tracking-wider text-[var(--neutral-500)]">Score</th>
                <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-[var(--neutral-500)]">Rating</th>
                <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-[var(--neutral-500)]">Issues</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => {
                const b = w.breakdown;
                const issues: string[] = [];
                if (b) {
                  if (b.daysMissed) issues.push(`${b.daysMissed} missed`);
                  if (b.lateArrivals) issues.push(`${b.lateArrivals} late`);
                  if (b.rejectedAttendance) issues.push(`${b.rejectedAttendance} rejected`);
                  if (b.routeDeviationAlerts) issues.push(`${b.routeDeviationAlerts} off-route`);
                  if (b.idleAlerts) issues.push(`${b.idleAlerts} idle`);
                  if (b.mockLocationFlags) issues.push(`${b.mockLocationFlags} mock-GPS`);
                  if (b.faceMismatches) issues.push(`${b.faceMismatches} face issues`);
                }
                return (
                  <tr
                    key={w.userId}
                    className="border-b border-[var(--border)] hover:bg-[var(--neutral-50)] cursor-pointer"
                    onClick={() => setOpenWorkerId(w.userId)}
                  >
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-[var(--neutral-800)]">{w.name}</div>
                      <div className="text-[11px] text-[var(--neutral-500)] font-mono">{w.employeeId}</div>
                    </td>
                    <td className="px-3 py-2.5 text-[var(--neutral-700)]">
                      {w.route ? (
                        <span className="font-mono text-xs">{w.route.code}</span>
                      ) : (
                        <span className="text-[var(--neutral-400)] text-xs italic">unassigned</span>
                      )}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-display font-bold text-lg ${scoreColor(w.score)}`}>
                      {w.score}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={ratingToBadge[w.rating]}>{ratingLabel[w.rating]}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[var(--neutral-600)]">
                      {issues.length ? issues.slice(0, 3).join(' · ') : <span className="text-[var(--neutral-400)]">no issues</span>}
                      {issues.length > 3 && <span className="text-[var(--neutral-400)]"> · +{issues.length - 3}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right text-[var(--neutral-400)]">
                      <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {openWorkerId && (
        <ReliabilityDetailModal
          userId={openWorkerId}
          days={days}
          onClose={() => setOpenWorkerId(null)}
        />
      )}
    </div>
  );
}

function ReliabilityDetailModal({
  userId,
  days,
  onClose,
}: {
  userId: string;
  days: number;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/staff/reliability/${userId}?days=${days}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success) setDetail(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId, days]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-[var(--border)]">
          <div>
            {detail ? (
              <>
                <p className="text-[11px] font-bold uppercase tracking-wider text-bmc-700">
                  Reliability — {detail.windowStart} to {detail.windowEnd}
                </p>
                <h3 className="font-display text-xl font-bold text-[var(--neutral-900)] mt-1">
                  {detail.worker.name}{' '}
                  <span className="text-sm font-mono text-[var(--neutral-500)]">
                    {detail.worker.employeeId}
                  </span>
                </h3>
                <p className="text-xs text-[var(--neutral-500)] mt-0.5">
                  {detail.worker.route?.code ?? 'Unassigned'} · Ward: {detail.worker.ward}
                </p>
              </>
            ) : (
              <h3 className="font-display text-xl font-bold text-[var(--neutral-900)]">Loading…</h3>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--neutral-400)] hover:text-[var(--neutral-700)] p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="p-6">
            <SkeletonRow />
          </div>
        ) : !detail ? (
          <div className="p-6 text-sm text-[var(--neutral-500)]">Could not load report.</div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Score + rating */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[var(--neutral-500)]">Overall</p>
                <p className={`font-display text-5xl font-bold ${scoreColor(detail.score)}`}>
                  {detail.score}
                  <span className="text-lg font-normal text-[var(--neutral-400)]">/100</span>
                </p>
                <Badge variant={ratingToBadge[detail.rating]} className="mt-1">
                  {ratingLabel[detail.rating]}
                </Badge>
              </div>
              <div className="text-xs text-[var(--neutral-600)] grid grid-cols-2 gap-x-6 gap-y-1">
                <span>Days analysed</span>
                <span className="font-mono">{detail.breakdown?.daysAnalyzed ?? 0}</span>
                <span>Scheduled</span>
                <span className="font-mono">{detail.breakdown?.daysScheduled ?? 0}</span>
                <span>Attended</span>
                <span className="font-mono">{detail.breakdown?.daysAttended ?? 0}</span>
                <span>Missed</span>
                <span className="font-mono">{detail.breakdown?.daysMissed ?? 0}</span>
                <span>Unavailability</span>
                <span className="font-mono">{detail.breakdown?.unavailabilityDays ?? 0}</span>
              </div>
            </div>

            {/* Trend bar chart */}
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[var(--neutral-500)] mb-2">
                Daily score trend
              </p>
              <TrendBars daily={detail.daily} />
            </div>

            {/* Issue counters */}
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[var(--neutral-500)] mb-2">
                Penalty events in this window
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <BreakdownTile label="Late arrivals" value={detail.breakdown?.lateArrivals ?? 0} />
                <BreakdownTile label="Geofence rejected" value={detail.breakdown?.rejectedAttendance ?? 0} severe />
                <BreakdownTile label="Route deviation" value={detail.breakdown?.routeDeviationAlerts ?? 0} />
                <BreakdownTile label="Idle alerts" value={detail.breakdown?.idleAlerts ?? 0} />
                <BreakdownTile label="Mock-GPS flags" value={detail.breakdown?.mockLocationFlags ?? 0} severe />
                <BreakdownTile label="Face issues" value={detail.breakdown?.faceMismatches ?? 0} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TrendBars({ daily }: { daily: DailyEntry[] }) {
  return (
    <div className="flex items-end gap-[3px] h-24 px-1 py-2 bg-[var(--neutral-50)] rounded border border-[var(--border)] overflow-x-auto">
      {daily.map((d) => {
        const h = d.scheduled ? Math.max(d.score, 4) : 4;
        const color = !d.scheduled
          ? '#cbd5e1' // slate-300 for "off / unavailable"
          : d.score >= 90
            ? '#15803d'
            : d.score >= 75
              ? '#0ea5e9'
              : d.score >= 60
                ? '#b45309'
                : '#b91c1c';
        return (
          <div
            key={d.date}
            title={`${d.date}: ${d.scheduled ? d.score : 'Off'}${d.events.unavailability ? ` (${d.events.unavailability})` : ''}`}
            className="flex-shrink-0 w-2.5 rounded-sm"
            style={{ height: `${h}%`, background: color, minHeight: '4px' }}
          />
        );
      })}
    </div>
  );
}

function BreakdownTile({ label, value, severe = false }: { label: string; value: number; severe?: boolean }) {
  const isProblem = value > 0;
  return (
    <div
      className={`px-3 py-2 rounded border ${
        isProblem
          ? severe
            ? 'border-status-red/30 bg-status-red-light'
            : 'border-amber-200 bg-amber-50'
          : 'border-[var(--border)] bg-[var(--neutral-50)]'
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-[var(--neutral-500)]">{label}</p>
      <p className={`font-display font-bold text-lg ${
        isProblem ? (severe ? 'text-status-red' : 'text-status-amber-dark') : 'text-[var(--neutral-700)]'
      }`}>
        {value}
      </p>
    </div>
  );
}
