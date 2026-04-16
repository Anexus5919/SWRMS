'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import DynamicRouteMap from '@/components/maps/DynamicRouteMap';
import { CHEMBUR_CENTER } from '@/lib/utils/constants';

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
}

const statusColors: Record<string, { border: string; badge: string; badgeBg: string; bar: string }> = {
  adequate: { border: 'border-l-status-green', badge: 'text-status-green', badgeBg: 'bg-status-green-light', bar: 'bg-status-green' },
  marginal: { border: 'border-l-status-amber', badge: 'text-status-amber', badgeBg: 'bg-status-amber-light', bar: 'bg-status-amber' },
  critical: { border: 'border-l-status-red', badge: 'text-status-red', badgeBg: 'bg-status-red-light', bar: 'bg-status-red' },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'map'>('grid');

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

  useEffect(() => {
    fetchDashboard();
    // Poll every 15 seconds for real-time updates
    const interval = setInterval(fetchDashboard, 15000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[var(--neutral-400)]">Loading dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-[var(--neutral-500)]">Could not load dashboard data.</p>
      </div>
    );
  }

  const { routes, summary } = data;
  const criticalRoutes = routes.filter((r) => r.statusLabel === 'critical');

  return (
    <div>
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
              {criticalRoutes.map((r) => r.code).join(', ')} — consider workforce reallocation
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

      {/* Header with stats and view toggle */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[var(--neutral-800)]">
              Route Dashboard
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs text-status-green">
              <span className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-sm text-[var(--neutral-500)] mt-0.5">
            Chembur Ward — {data.date}
          </p>
        </div>

        <div className="flex items-center gap-2">
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
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-[var(--border)] rounded-lg px-4 py-3">
          <p className="text-[10px] text-[var(--neutral-500)] uppercase tracking-wider">Attendance</p>
          <p className="text-xl font-bold text-[var(--neutral-800)] mt-0.5">
            {summary.totalPresent}
            <span className="text-sm font-normal text-[var(--neutral-400)]">/{summary.totalStaffRequired}</span>
          </p>
          <p className="text-[10px] text-bmc-600">{summary.overallAttendanceRate}% present</p>
        </div>
        <div className="bg-white border border-[var(--border)] rounded-lg px-4 py-3">
          <p className="text-[10px] text-[var(--neutral-500)] uppercase tracking-wider">Routes Active</p>
          <p className="text-xl font-bold text-[var(--neutral-800)] mt-0.5">{summary.totalRoutes}</p>
          <p className="text-[10px] text-status-green">{summary.completedRoutes} completed</p>
        </div>
        <div className="bg-white border border-[var(--border)] rounded-lg px-4 py-3">
          <p className="text-[10px] text-[var(--neutral-500)] uppercase tracking-wider">Critical</p>
          <p className={`text-xl font-bold mt-0.5 ${summary.criticalRoutes > 0 ? 'text-status-red' : 'text-[var(--neutral-800)]'}`}>
            {summary.criticalRoutes}
          </p>
          <p className="text-[10px] text-[var(--neutral-400)]">understaffed routes</p>
        </div>
        <div className="bg-white border border-[var(--border)] rounded-lg px-4 py-3">
          <p className="text-[10px] text-[var(--neutral-500)] uppercase tracking-wider">Rejected</p>
          <p className="text-xl font-bold text-[var(--neutral-800)] mt-0.5">{summary.totalRejected}</p>
          <p className="text-[10px] text-[var(--neutral-400)]">geofence failures</p>
        </div>
      </div>

      {/* Map view */}
      {view === 'map' && routes.length > 0 && (
        <div className="mb-6">
          <DynamicRouteMap
            startPoint={routes[0].startPoint}
            endPoint={routes[0].endPoint}
            height="350px"
          />
        </div>
      )}

      {/* Route cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.map((route) => {
          const colors = statusColors[route.statusLabel] || statusColors.adequate;

          return (
            <Link
              key={route._id}
              href={`/routes/${route._id}`}
              className={`block bg-white border border-[var(--border)] border-l-4 ${colors.border} rounded-lg p-4 hover:bg-[var(--neutral-50)] transition-colors`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold text-[var(--neutral-600)]">
                  {route.code}
                </span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${colors.badge} ${colors.badgeBg} px-2 py-0.5 rounded`}>
                  {route.statusLabel}
                </span>
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
                  className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
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
            </Link>
          );
        })}
      </div>

      {routes.length === 0 && (
        <div className="text-center py-12 bg-white border border-[var(--border)] rounded-lg">
          <p className="text-sm text-[var(--neutral-500)]">No active routes found.</p>
        </div>
      )}
    </div>
  );
}
