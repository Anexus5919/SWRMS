'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import DashboardOverviewMap from '@/components/maps/DynamicDashboardOverviewMap';
import KpiRollupCard from '@/components/supervisor/KpiRollupCard';
import {
  Badge,
  Breadcrumbs,
  Button,
  Card,
  EmptyState,
  SkeletonCard,
} from '@/components/ui';
import { RoutePin } from '@/components/brand/Illustrations';

interface RouteItem {
  _id: string;
  name: string;
  code: string;
  startPoint: { lat: number; lng: number; label?: string };
  endPoint: { lat: number; lng: number; label?: string };
  estimatedLengthKm: number;
  requiredStaff: number;
  presentStaff: number;
  staffingRatio: number;
  statusLabel: 'adequate' | 'marginal' | 'critical';
  routeProgress: { status: string; completionPercentage: number };
}

interface DashboardData {
  date: string;
  routes: RouteItem[];
  summary: {
    totalRoutes: number;
    totalStaffRequired: number;
    totalPresent: number;
    totalRejected: number;
    criticalRoutes: number;
    completedRoutes: number;
    overallAttendanceRate: number;
  };
  alerts?: {
    critical: number;
    warnings: number;
    pendingReviews: number;
    total: number;
  };
}

interface LivePosition {
  userId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  routeId: string;
  coordinates: { lat: number; lng: number; accuracy?: number | null };
  recordedAt: string;
  isOffRoute: boolean;
  distanceFromRouteMeters: number | null;
}

const statusToBadge: Record<RouteItem['statusLabel'], 'green' | 'amber' | 'red'> = {
  adequate: 'green',
  marginal: 'amber',
  critical: 'red',
};

const statusToCardBorder: Record<RouteItem['statusLabel'], 'green' | 'amber' | 'red'> = {
  adequate: 'green',
  marginal: 'amber',
  critical: 'red',
};

const statusToBar: Record<RouteItem['statusLabel'], string> = {
  adequate: 'bg-status-green',
  marginal: 'bg-status-amber',
  critical: 'bg-status-red',
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [livePositions, setLivePositions] = useState<LivePosition[]>([]);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      // Will retry on next interval
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLivePositions = useCallback(async () => {
    try {
      const res = await fetch('/api/tracking/live');
      const json = await res.json();
      if (json.success) setLivePositions(json.data?.positions ?? []);
    } catch {
      // Tracking is non-critical for the rest of the dashboard.
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const dashInterval = setInterval(fetchDashboard, 15000);
    return () => clearInterval(dashInterval);
  }, [fetchDashboard]);

  // Live positions: prefer the SSE stream (one connection, server-paced
  // 5s ticks). Fall back to polling if SSE fails — older proxies, dev
  // hot-reloads, or network policies sometimes strip text/event-stream.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      fetchLivePositions();
      const id = setInterval(fetchLivePositions, 10_000);
      return () => clearInterval(id);
    }

    let pollId: ReturnType<typeof setInterval> | null = null;
    const es = new EventSource('/api/tracking/stream');

    const startPollingFallback = () => {
      if (pollId) return;
      fetchLivePositions();
      pollId = setInterval(fetchLivePositions, 10_000);
    };

    es.addEventListener('positions', (e) => {
      try {
        const payload = JSON.parse((e as MessageEvent).data);
        setLivePositions(payload.positions ?? []);
      } catch {
        // Malformed payload — ignore this tick.
      }
    });

    es.onerror = () => {
      // EventSource auto-reconnects on transient errors. Only fall back
      // to polling once the connection is permanently closed (e.g. an
      // intermediary stripped the stream).
      if (es.readyState === EventSource.CLOSED) {
        startPollingFallback();
      }
    };

    return () => {
      es.close();
      if (pollId) clearInterval(pollId);
    };
  }, [fetchLivePositions]);

  // Page header (always rendered, even during loading)
  const PageHeader = ({ subtitle }: { subtitle: string }) => (
    <div className="mb-6">
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]}
        className="mb-4"
      />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-bmc-700">
            Live Operations
          </p>
          <h1 className="font-display text-3xl font-bold text-[var(--neutral-900)] mt-1">
            Route Dashboard
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{subtitle}</p>
          <div className="divider-gold w-24 my-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-status-green">
            <span className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
            Live
          </span>
          <Button variant="ghost" size="sm" onClick={fetchDashboard}>
            Refresh now
          </Button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div>
        <PageHeader subtitle="Loading latest field telemetry..." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <PageHeader subtitle="Dashboard data unavailable" />
        <Card padded>
          <EmptyState
            title="Could not load dashboard"
            description="There was a problem reaching the dashboard service. Please try refreshing in a moment."
            action={
              <Button variant="primary" onClick={fetchDashboard}>
                Try again
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const { routes, summary } = data;
  const criticalRoutes = routes.filter((r) => r.statusLabel === 'critical');

  return (
    <div>
      <PageHeader subtitle={`Chembur Ward - ${data.date}`} />

      {/* Alert banner for critical routes */}
      {criticalRoutes.length > 0 && (
        <div className="mb-4 p-3 bg-status-red-light border border-status-red/20 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 text-status-red flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-status-red">
              {criticalRoutes.length} route{criticalRoutes.length > 1 ? 's' : ''} critically understaffed
            </p>
            <p className="text-xs text-status-red/80 mt-0.5">
              {criticalRoutes.map((r) => r.code).join(', ')} - consider workforce reallocation
            </p>
          </div>
          <Link
            href="/reallocation"
            className="ml-auto text-xs font-medium text-status-red underline whitespace-nowrap"
          >
            Reallocate
          </Link>
        </div>
      )}

      {/* Verification alerts banner */}
      {data.alerts && data.alerts.total > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-amber-700">{data.alerts.total}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800">
              Verification issues need attention
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {data.alerts.critical > 0 && `${data.alerts.critical} critical`}
              {data.alerts.critical > 0 && data.alerts.warnings > 0 && ' · '}
              {data.alerts.warnings > 0 && `${data.alerts.warnings} warnings`}
              {(data.alerts.critical > 0 || data.alerts.warnings > 0) && data.alerts.pendingReviews > 0 && ' · '}
              {data.alerts.pendingReviews > 0 && `${data.alerts.pendingReviews} photos pending review`}
            </p>
          </div>
          <Link
            href="/supervisor-logs"
            className="flex-shrink-0 bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-700"
          >
            Review
          </Link>
        </div>
      )}

      {/* View toggle */}
      <div className="flex items-center justify-end gap-2 mb-5">
        <button
          onClick={() => setView('grid')}
          className={`px-3 py-1.5 text-xs rounded transition-colors ${
            view === 'grid' ? 'bg-bmc-700 text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'
          }`}
        >
          Grid
        </button>
        <button
          onClick={() => setView('map')}
          className={`px-3 py-1.5 text-xs rounded transition-colors ${
            view === 'map' ? 'bg-bmc-700 text-white' : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'
          }`}
        >
          Map
        </button>
      </div>

      {/* Trailing-window KPI rollup (% completed by 10am/12pm/2pm).
          Hidden when there's no historical data yet. */}
      <KpiRollupCard days={14} />

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card statusBorder="blue" className="px-4 py-3">
          <p className="text-[10px] text-[var(--neutral-500)] uppercase tracking-wider">Attendance</p>
          <p className="text-xl font-bold text-[var(--neutral-800)] mt-0.5 font-display">
            {summary.totalPresent}
            <span className="text-sm font-normal text-[var(--neutral-400)]">/{summary.totalStaffRequired}</span>
          </p>
          <p className="text-[10px] text-bmc-600">{summary.overallAttendanceRate}% present</p>
        </Card>
        <Card statusBorder="green" className="px-4 py-3">
          <p className="text-[10px] text-[var(--neutral-500)] uppercase tracking-wider">Routes Active</p>
          <p className="text-xl font-bold text-[var(--neutral-800)] mt-0.5 font-display">{summary.totalRoutes}</p>
          <p className="text-[10px] text-status-green">{summary.completedRoutes} completed</p>
        </Card>
        <Card statusBorder="red" className="px-4 py-3">
          <p className="text-[10px] text-[var(--neutral-500)] uppercase tracking-wider">Critical</p>
          <p className={`text-xl font-bold mt-0.5 font-display ${summary.criticalRoutes > 0 ? 'text-status-red' : 'text-[var(--neutral-800)]'}`}>
            {summary.criticalRoutes}
          </p>
          <p className="text-[10px] text-[var(--neutral-400)]">understaffed routes</p>
        </Card>
        <Card statusBorder="amber" className="px-4 py-3">
          <p className="text-[10px] text-[var(--neutral-500)] uppercase tracking-wider">Rejected</p>
          <p className="text-xl font-bold text-[var(--neutral-800)] mt-0.5 font-display">{summary.totalRejected}</p>
          <p className="text-[10px] text-[var(--neutral-400)]">geofence failures</p>
        </Card>
      </div>

      {/* Map view: every active route, color-coded by staffing status,
          with live worker pins overlaid (refreshes every 10s). */}
      {view === 'map' && (
        <div className="mb-6">
          <DashboardOverviewMap
            routes={routes}
            livePositions={livePositions}
            height="450px"
          />
          {routes.length > 0 && (
            <div className="mt-2 flex items-center gap-4 text-[10px] text-[var(--neutral-500)] flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#15803d' }} />
                Adequate
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#b45309' }} />
                Marginal
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#b91c1c' }} />
                Critical
              </span>
              <span className="inline-flex items-center gap-1.5 ml-2">
                <span
                  className="w-2.5 h-2.5 rounded-full border-2"
                  style={{ borderColor: '#1d4ed8', background: '#dbeafe' }}
                />
                Worker on route ({livePositions.filter((p) => !p.isOffRoute).length})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full border-2"
                  style={{ borderColor: '#b91c1c', background: '#fee2e2' }}
                />
                Worker off route ({livePositions.filter((p) => p.isOffRoute).length})
              </span>
            </div>
          )}
        </div>
      )}

      {/* Route cards grid */}
      {routes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((route) => {
            const badgeVariant = statusToBadge[route.statusLabel] || 'green';
            const cardBorder = statusToCardBorder[route.statusLabel] || 'green';
            const barColor = statusToBar[route.statusLabel] || 'bg-status-green';

            return (
              <Link key={route._id} href={`/routes/${route._id}`} className="block">
                <Card statusBorder={cardBorder} hoverable className="p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-[var(--neutral-600)]">
                      {route.code}
                    </span>
                    <Badge variant={badgeVariant}>{route.statusLabel}</Badge>
                  </div>

                  <p className="text-sm font-medium text-[var(--neutral-800)] mb-3 leading-snug">
                    {route.name}
                  </p>

                  <div className="flex items-center justify-between text-xs text-[var(--neutral-500)] mb-2">
                    <span>
                      Staff: <span className="font-semibold text-[var(--neutral-700)]">{route.presentStaff}/{route.requiredStaff}</span>
                    </span>
                    <span>
                      {route.routeProgress.completionPercentage}%
                      {route.routeProgress.status === 'completed' && (
                        <svg className="w-3.5 h-3.5 inline ml-1 text-status-green" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-[var(--neutral-100)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${route.routeProgress.completionPercentage}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-[var(--neutral-400)]">
                      {route.estimatedLengthKm} km
                    </span>
                    <span className="text-[10px] text-[var(--neutral-400)] capitalize">
                      {route.routeProgress.status.replace('_', ' ')}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="No active routes today"
            description="When supervisors activate collection routes, they will appear here in real time."
            illustration={<RoutePin className="w-full h-full" />}
          />
        </Card>
      )}
    </div>
  );
}

