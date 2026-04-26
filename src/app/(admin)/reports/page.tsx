'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Breadcrumbs, Button } from '@/components/ui';
import PrintHeader from '@/components/layout/PrintHeader';
import PrintFooter from '@/components/layout/PrintFooter';
import PrintCornerStamp from '@/components/layout/PrintCornerStamp';

type ReportTab = 'daily_summary' | 'attendance_trend' | 'route_performance' | 'verification_summary';

interface DailySummaryData {
  date: string;
  attendance: {
    totalStaff: number;
    present: number;
    absent: number;
    rejected: number;
    attendanceRate: number;
  };
  routes: {
    total: number;
    completed: number;
    inProgress: number;
    stalled: number;
    notStarted: number;
    completionRate: number;
  };
  reallocations: number;
  verification: {
    totalLogs: number;
    critical: number;
    open: number;
    geoPhotos: number;
  };
}

interface TrendPoint {
  date: string;
  present: number;
  total: number;
  rate: number;
}

interface RoutePerformanceItem {
  routeId: string;
  name: string;
  code: string;
  requiredStaff: number;
  presentStaff: number;
  staffingRatio: number;
  status: string;
  completionPercentage: number;
}

interface LogBreakdownItem {
  _id: { type: string; severity: string };
  count: number;
}

interface PhotoBreakdownItem {
  _id: { confidence: string; reviewStatus: string };
  count: number;
}

interface VerificationData {
  logBreakdown: LogBreakdownItem[];
  photoBreakdown: PhotoBreakdownItem[];
  date: string;
}

const TABS: { key: ReportTab; label: string }[] = [
  { key: 'daily_summary', label: 'Daily Summary' },
  { key: 'attendance_trend', label: 'Attendance Trend' },
  { key: 'route_performance', label: 'Route Performance' },
  { key: 'verification_summary', label: 'Verification Summary' },
];

function todayStr(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function weekAgoStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('daily_summary');
  const [date, setDate] = useState(todayStr);
  const [startDate, setStartDate] = useState(weekAgoStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data state per tab
  const [dailySummary, setDailySummary] = useState<DailySummaryData | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [routePerf, setRoutePerf] = useState<RoutePerformanceItem[]>([]);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams({ type: activeTab });
    if (activeTab === 'attendance_trend') {
      params.set('startDate', startDate);
      params.set('endDate', endDate);
    } else {
      params.set('date', date);
    }

    try {
      const res = await fetch(`/api/reports?${params}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || 'Failed to load report');
        return;
      }

      switch (activeTab) {
        case 'daily_summary':
          setDailySummary(json.data);
          break;
        case 'attendance_trend':
          setTrendData(json.data.trend || []);
          break;
        case 'route_performance':
          setRoutePerf(json.data);
          break;
        case 'verification_summary':
          setVerificationData(json.data);
          break;
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, date, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const inputCls =
    'px-3 py-2 text-sm border border-[var(--border)] rounded bg-[var(--neutral-50)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30';
  const labelCls =
    'text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider';

  const currentTabLabel = TABS.find((t) => t.key === activeTab)?.label ?? 'Report';
  const reportDateForPrint = activeTab === 'attendance_trend' ? `${startDate} → ${endDate}` : date;

  return (
    <div>
      {/* Print-only: etched seal stamp on every printed page (bottom-right). */}
      <PrintCornerStamp />
      {/* Print-only letterhead */}
      <PrintHeader
        title={currentTabLabel}
        reportType="Operational Report"
        reportDate={reportDateForPrint}
      />

      {/* Screen-only page chrome */}
      <div className="no-print">
        <div className="mb-6">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Reports' }]}
            className="mb-4"
          />
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-bmc-700">
                Analytics
              </p>
              <h1 className="font-display text-3xl font-bold text-[var(--neutral-900)] mt-1">
                Reports & Analytics
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Attendance analytics, route completion rates, and verification history.
              </p>
              <div className="divider-gold w-24 my-4" />
            </div>
            <Button variant="secondary" onClick={() => window.print()}>
              Print Report
            </Button>
          </div>
        </div>

        {/* Date pickers */}
        <div className="bg-white border border-[var(--border)] rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            {activeTab === 'attendance_trend' ? (
              <>
                <div>
                  <label className={labelCls}>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputCls + ' block mt-1'}
                  />
                </div>
                <div>
                  <label className={labelCls}>End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={inputCls + ' block mt-1'}
                  />
                </div>
              </>
            ) : (
              <div>
                <label className={labelCls}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputCls + ' block mt-1'}
                />
              </div>
            )}
            <button
              onClick={fetchReport}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex flex-wrap gap-1 mb-6 bg-[var(--neutral-100)] rounded-lg p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-xs font-medium rounded transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-[var(--neutral-500)] hover:text-[var(--neutral-700)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-xs text-status-red bg-status-red-light border border-status-red/20 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-sm text-[var(--neutral-400)]">
          Loading report...
        </div>
      )}

      {/* Tab content */}
      {!loading && !error && (
        <>
          {activeTab === 'daily_summary' && dailySummary && (
            <DailySummaryView data={dailySummary} />
          )}
          {activeTab === 'attendance_trend' && (
            <AttendanceTrendView data={trendData} />
          )}
          {activeTab === 'route_performance' && (
            <RoutePerformanceView data={routePerf} />
          )}
          {activeTab === 'verification_summary' && verificationData && (
            <VerificationSummaryView data={verificationData} />
          )}
        </>
      )}

      {/* Print-only footer */}
      <PrintFooter />
    </div>
  );
}

/* ── Daily Summary ──────────────────────────────────────────── */

function StatCard({
  title,
  value,
  subtitle,
  accent = 'emerald',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  accent?: 'emerald' | 'amber' | 'red' | 'blue';
}) {
  const accentMap = {
    emerald: 'border-l-emerald-500',
    amber: 'border-l-amber-500',
    red: 'border-l-red-500',
    blue: 'border-l-blue-500',
  };

  return (
    <div
      className={`bg-white border border-[var(--border)] border-l-4 ${accentMap[accent]} rounded-lg p-4`}
    >
      <p className="text-[10px] font-medium text-[var(--neutral-500)] uppercase tracking-wider mb-1">
        {title}
      </p>
      <p className="text-2xl font-bold text-[var(--neutral-800)]">{value}</p>
      {subtitle && (
        <p className="text-xs text-[var(--neutral-400)] mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function DailySummaryView({ data }: { data: DailySummaryData }) {
  const { attendance, routes, reallocations, verification } = data;

  return (
    <div className="space-y-6">
      {/* Attendance section */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--neutral-700)] mb-3">
          Attendance
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Attendance Rate" value={`${attendance.attendanceRate}%`} subtitle={`${attendance.present} of ${attendance.totalStaff} staff`} accent="emerald" />
          <StatCard title="Present" value={attendance.present} accent="emerald" />
          <StatCard title="Absent" value={attendance.absent} accent="red" />
          <StatCard title="Rejected" value={attendance.rejected} accent="amber" />
        </div>
      </div>

      {/* Routes section */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--neutral-700)] mb-3">
          Routes
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Completion Rate" value={`${routes.completionRate}%`} subtitle={`${routes.completed} of ${routes.total} routes`} accent="emerald" />
          <StatCard title="In Progress" value={routes.inProgress} accent="blue" />
          <StatCard title="Stalled" value={routes.stalled} accent="amber" />
          <StatCard title="Reallocations" value={reallocations} accent="blue" />
        </div>
      </div>

      {/* Verification section */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--neutral-700)] mb-3">
          Verification
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Logs" value={verification.totalLogs} accent="blue" />
          <StatCard title="Critical" value={verification.critical} accent="red" />
          <StatCard title="Open Issues" value={verification.open} accent="amber" />
          <StatCard title="Geo Photos" value={verification.geoPhotos} accent="emerald" />
        </div>
      </div>
    </div>
  );
}

/* ── Attendance Trend ───────────────────────────────────────── */

function AttendanceTrendView({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-[var(--border)] rounded-lg p-8 text-center text-xs text-[var(--neutral-400)]">
        No attendance data for the selected range.
      </div>
    );
  }

  return (
    <div className="bg-white border border-[var(--border)] rounded-lg p-6">
      <h3 className="text-sm font-semibold text-[var(--neutral-700)] mb-4">
        Attendance Rate Over Time
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickFormatter={(v) => String(v).slice(5)}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(value) => [`${value}%`, 'Rate']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#059669"
              strokeWidth={2}
              dot={{ r: 4, fill: '#059669' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary table below chart */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--neutral-50)] border-b border-[var(--border)]">
              <th className="text-left px-4 py-2 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Date</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Present</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Total</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {data.map((row) => (
              <tr key={row.date} className="hover:bg-[var(--neutral-50)]">
                <td className="px-4 py-2 text-xs font-mono text-[var(--neutral-700)]">{row.date}</td>
                <td className="px-4 py-2 text-xs text-[var(--neutral-600)]">{row.present}</td>
                <td className="px-4 py-2 text-xs text-[var(--neutral-500)]">{row.total}</td>
                <td className="px-4 py-2 text-xs font-semibold text-emerald-700">{row.rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Route Performance ──────────────────────────────────────── */

function RoutePerformanceView({ data }: { data: RoutePerformanceItem[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-[var(--border)] rounded-lg p-8 text-center text-xs text-[var(--neutral-400)]">
        No route performance data for the selected date.
      </div>
    );
  }

  const chartData = data.map((r) => ({
    name: r.code,
    completion: r.completionPercentage,
    staffing: Math.round(r.staffingRatio * 100),
  }));

  return (
    <div className="space-y-6">
      {/* Bar chart */}
      <div className="bg-white border border-[var(--border)] rounded-lg p-6">
        <h3 className="text-sm font-semibold text-[var(--neutral-700)] mb-4">
          Completion % and Staffing Ratio by Route
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(value, name) => [`${value}%`, name === 'completion' ? 'Completion' : 'Staffing']} />
              <Bar dataKey="completion" fill="#059669" radius={[4, 4, 0, 0]} name="Completion" />
              <Bar dataKey="staffing" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Staffing" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail table */}
      <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--neutral-50)] border-b border-[var(--border)]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Code</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Completion</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Staff</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Staffing Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data.map((r) => (
                <tr key={r.routeId} className="hover:bg-[var(--neutral-50)]">
                  <td className="px-4 py-3 text-xs font-mono font-semibold text-[var(--neutral-700)]">{r.code}</td>
                  <td className="px-4 py-3 text-xs text-[var(--neutral-800)]">{r.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                        r.status === 'completed'
                          ? 'text-emerald-700 bg-emerald-50'
                          : r.status === 'in_progress'
                          ? 'text-blue-700 bg-blue-50'
                          : r.status === 'stalled'
                          ? 'text-status-amber bg-status-amber-light'
                          : 'text-[var(--neutral-500)] bg-[var(--neutral-100)]'
                      }`}
                    >
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-emerald-700">
                    {r.completionPercentage}%
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--neutral-600)]">
                    {r.presentStaff} / {r.requiredStaff}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold ${
                        r.staffingRatio >= 1
                          ? 'text-emerald-700'
                          : r.staffingRatio >= 0.5
                          ? 'text-status-amber'
                          : 'text-status-red'
                      }`}
                    >
                      {Math.round(r.staffingRatio * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Verification Summary ───────────────────────────────────── */

function VerificationSummaryView({ data }: { data: VerificationData }) {
  const { logBreakdown, photoBreakdown } = data;

  const severityColor = (s: string) => {
    switch (s) {
      case 'critical':
        return 'text-status-red bg-status-red-light';
      case 'high':
        return 'text-orange-700 bg-orange-50';
      case 'medium':
        return 'text-status-amber bg-status-amber-light';
      default:
        return 'text-[var(--neutral-600)] bg-[var(--neutral-100)]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Log breakdown */}
      <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--neutral-50)]">
          <h3 className="text-sm font-semibold text-[var(--neutral-700)]">
            Verification Logs by Type and Severity
          </h3>
        </div>
        {logBreakdown.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-[var(--neutral-400)]">
            No verification logs for this date.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Severity</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {logBreakdown.map((item, i) => (
                  <tr key={i} className="hover:bg-[var(--neutral-50)]">
                    <td className="px-4 py-3 text-xs text-[var(--neutral-700)] capitalize">
                      {item._id.type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${severityColor(item._id.severity)}`}
                      >
                        {item._id.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-[var(--neutral-800)]">
                      {item.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Photo breakdown */}
      <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--neutral-50)]">
          <h3 className="text-sm font-semibold text-[var(--neutral-700)]">
            Geo Photo Verification
          </h3>
        </div>
        {photoBreakdown.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-[var(--neutral-400)]">
            No photo verification data for this date.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Confidence</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Review Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {photoBreakdown.map((item, i) => (
                  <tr key={i} className="hover:bg-[var(--neutral-50)]">
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                          item._id.confidence === 'high'
                            ? 'text-emerald-700 bg-emerald-50'
                            : item._id.confidence === 'medium'
                            ? 'text-status-amber bg-status-amber-light'
                            : 'text-status-red bg-status-red-light'
                        }`}
                      >
                        {item._id.confidence || 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--neutral-700)] capitalize">
                      {(item._id.reviewStatus || 'pending').replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-[var(--neutral-800)]">
                      {item.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
