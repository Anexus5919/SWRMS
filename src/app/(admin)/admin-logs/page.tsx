'use client';

import { useEffect, useState, useCallback } from 'react';
import { rowsToCsv, downloadCsv, timestampSlug } from '@/lib/utils/csv';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Severity = 'info' | 'warning' | 'critical';
type LogStatus = 'open' | 'acknowledged' | 'resolved' | 'dismissed';
type LogType =
  | 'missing_photo'
  | 'face_mismatch'
  | 'no_face_detected'
  | 'headcount_mismatch'
  | 'location_anomaly';

interface VerificationLog {
  _id: string;
  severity: Severity;
  type: LogType;
  affectedUserId?: { employeeId: string; name: { first: string; last: string } };
  routeId?: { name: string; code: string };
  details: { message: string; faceDistance?: number; coordinates?: { lat: number; lng: number } };
  resolution: { status: LogStatus; resolvedBy?: any; resolvedAt?: string; notes?: string };
  geoPhotoId?: string;
  wardName?: string;
  createdAt: string;
}

interface LogSummary {
  total: number;
  criticalOpen: number;
  warnings: number;
  resolvedToday: number;
}

interface PhotoData {
  _id: string;
  url: string;
  profilePhotoUrl?: string;
  workerName: string;
  capturedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const severityStyles: Record<Severity, { badge: string; bg: string; dot: string }> = {
  critical: { badge: 'text-status-red', bg: 'bg-status-red-light', dot: 'bg-status-red' },
  warning: { badge: 'text-status-amber', bg: 'bg-status-amber-light', dot: 'bg-status-amber' },
  info: { badge: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500' },
};

const statusStyles: Record<LogStatus, { text: string; bg: string }> = {
  open: { text: 'text-status-red', bg: 'bg-status-red-light' },
  acknowledged: { text: 'text-status-amber', bg: 'bg-status-amber-light' },
  resolved: { text: 'text-status-green', bg: 'bg-status-green-light' },
  dismissed: { text: 'text-[var(--neutral-500)]', bg: 'bg-[var(--neutral-100)]' },
};

const typeLabels: Record<LogType, string> = {
  missing_photo: 'Missing Photo',
  face_mismatch: 'Face Mismatch',
  no_face_detected: 'No Face Detected',
  headcount_mismatch: 'Headcount Mismatch',
  location_anomaly: 'Location Anomaly',
};

const LOG_TYPES: LogType[] = [
  'missing_photo',
  'face_mismatch',
  'no_face_detected',
  'headcount_mismatch',
  'location_anomaly',
];

const PAGE_SIZE = 20;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminVerificationLogsPage() {
  /* --- state --- */
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [summary, setSummary] = useState<LogSummary>({ total: 0, criticalOpen: 0, warnings: 0, resolvedToday: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /* filters */
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [severity, setSeverity] = useState<'all' | Severity>('all');
  const [status, setStatus] = useState<'all' | LogStatus>('all');
  const [type, setType] = useState<'all' | LogType>('all');

  /* photo modal */
  const [photoModal, setPhotoModal] = useState<PhotoData | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  /* --- fetch (admin scope = all wards) --- */
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date, page: String(page), limit: String(PAGE_SIZE), scope: 'all' });
      if (severity !== 'all') params.set('severity', severity);
      if (status !== 'all') params.set('status', status);
      if (type !== 'all') params.set('type', type);

      const res = await fetch(`/api/verification?${params}`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.data.logs ?? json.data ?? []);
        if (json.data.summary) setSummary(json.data.summary);
        if (json.data.totalPages) setTotalPages(json.data.totalPages);
      }
    } catch {
      // retry on next attempt
    } finally {
      setLoading(false);
    }
  }, [date, severity, status, type, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  /* reset page when filters change */
  useEffect(() => {
    setPage(1);
  }, [date, severity, status, type]);

  /* --- actions --- */
  const updateLogStatus = async (logId: string, newStatus: LogStatus) => {
    setActionLoading(logId);
    try {
      const res = await fetch('/api/verification', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId, status: newStatus }),
      });
      if (res.ok) {
        setLogs((prev) =>
          prev.map((l) => (l._id === logId ? { ...l, status: newStatus } : l)),
        );
        fetchLogs();
      }
    } catch {
      // handle error
    } finally {
      setActionLoading(null);
    }
  };

  const openPhoto = async (photoId: string) => {
    setPhotoLoading(true);
    try {
      const res = await fetch(`/api/photos/${photoId}`);
      const json = await res.json();
      if (json.success) setPhotoModal(json.data);
    } catch {
      // handle error
    } finally {
      setPhotoLoading(false);
    }
  };

  const handlePhotoAction = async (photoId: string, action: 'approved' | 'rejected') => {
    try {
      await fetch(`/api/photos/${photoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      });
      setPhotoModal(null);
      fetchLogs();
    } catch {
      // handle error
    }
  };

  const handleExport = () => {
    if (logs.length === 0) {
      alert('No logs in the current view to export.');
      return;
    }
    // Flatten the populated VerificationLog into one CSV row per entry.
    // Date formatting follows IST conventions so the file opens cleanly
    // in Excel without locale guesswork. Coordinates split into two
    // columns so they're sortable / map-importable.
    const rows = logs.map((l) => ({
      'When (IST)': new Date(l.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      Severity: l.severity,
      Type: l.type.replace(/_/g, ' '),
      Status: l.resolution.status,
      'Worker ID': l.affectedUserId?.employeeId ?? '',
      'Worker Name': l.affectedUserId
        ? `${l.affectedUserId.name.first} ${l.affectedUserId.name.last}`.trim()
        : '',
      'Route Code': l.routeId?.code ?? '',
      'Route Name': l.routeId?.name ?? '',
      Ward: l.wardName ?? '',
      Latitude: l.details.coordinates?.lat ?? '',
      Longitude: l.details.coordinates?.lng ?? '',
      'Face Distance': l.details.faceDistance ?? '',
      Message: l.details.message,
      'Resolved At': l.resolution.resolvedAt
        ? new Date(l.resolution.resolvedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        : '',
      Notes: l.resolution.notes ?? '',
    }));
    const columns = Object.keys(rows[0]);
    const csv = rowsToCsv(rows, columns);
    downloadCsv(`verification-logs-${date}-${timestampSlug()}.csv`, csv);
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-[var(--neutral-800)]">
            Verification Logs
          </h2>
          <p className="text-sm text-[var(--neutral-500)] mt-0.5">
            All wards &mdash; review verification issues and take action.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 text-xs font-medium border border-bmc-700 text-bmc-700 rounded hover:bg-bmc-50 transition-colors"
          >
            Export
          </button>
          <button
            onClick={fetchLogs}
            className="px-4 py-2 text-xs font-medium bg-bmc-700 text-white rounded hover:bg-bmc-800 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-1.5 text-xs border border-[var(--border)] rounded bg-white text-[var(--neutral-700)] focus:outline-none focus:ring-1 focus:ring-bmc-500"
        />
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value as typeof severity)}
          className="px-3 py-1.5 text-xs border border-[var(--border)] rounded bg-white text-[var(--neutral-700)] focus:outline-none focus:ring-1 focus:ring-bmc-500"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="px-3 py-1.5 text-xs border border-[var(--border)] rounded bg-white text-[var(--neutral-700)] focus:outline-none focus:ring-1 focus:ring-bmc-500"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="px-3 py-1.5 text-xs border border-[var(--border)] rounded bg-white text-[var(--neutral-700)] focus:outline-none focus:ring-1 focus:ring-bmc-500"
        >
          <option value="all">All Types</option>
          {LOG_TYPES.map((t) => (
            <option key={t} value={t}>
              {typeLabels[t]}
            </option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-[var(--border)] rounded-lg px-4 py-3">
          <p className="text-[10px] text-[var(--neutral-500)] uppercase tracking-wider">Total Logs</p>
          <p className="text-xl font-bold text-[var(--neutral-800)] mt-0.5">{summary.total}</p>
        </div>
        <div className="bg-white border border-[var(--border)] rounded-lg px-4 py-3">
          <p className="text-[10px] text-[var(--neutral-500)] uppercase tracking-wider">Critical Open</p>
          <p className={`text-xl font-bold mt-0.5 ${summary.criticalOpen > 0 ? 'text-status-red' : 'text-[var(--neutral-800)]'}`}>
            {summary.criticalOpen}
          </p>
        </div>
        <div className="bg-white border border-[var(--border)] rounded-lg px-4 py-3">
          <p className="text-[10px] text-[var(--neutral-500)] uppercase tracking-wider">Warnings</p>
          <p className="text-xl font-bold text-status-amber mt-0.5">{summary.warnings}</p>
        </div>
        <div className="bg-white border border-[var(--border)] rounded-lg px-4 py-3">
          <p className="text-[10px] text-[var(--neutral-500)] uppercase tracking-wider">Resolved Today</p>
          <p className="text-xl font-bold text-status-green mt-0.5">{summary.resolvedToday}</p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-[var(--neutral-400)]">Loading verification logs...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && logs.length === 0 && (
        <div className="bg-white border border-[var(--border)] rounded-lg p-8 text-center">
          <svg className="w-8 h-8 mx-auto text-status-green mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-[var(--neutral-600)]">No verification logs found for the selected filters.</p>
        </div>
      )}

      {/* Log list */}
      {!loading && logs.length > 0 && (
        <div className="space-y-3">
          {logs.map((log) => {
            const sevStyle = severityStyles[log.severity];
            const statStyle = statusStyles[log.resolution?.status as LogStatus] || statusStyles.open;

            return (
              <div
                key={log._id}
                className="bg-white border border-[var(--border)] rounded-lg p-4"
              >
                {/* Top row: badges + time */}
                <div className="flex items-center flex-wrap gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${sevStyle.badge} ${sevStyle.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sevStyle.dot}`} />
                    {log.severity}
                  </span>
                  <span className="text-[10px] font-medium text-[var(--neutral-600)] bg-[var(--neutral-100)] px-2 py-0.5 rounded">
                    {typeLabels[log.type] ?? log.type}
                  </span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${statStyle.text} ${statStyle.bg}`}>
                    {log.resolution?.status}
                  </span>
                  {log.wardName && (
                    <span className="text-[10px] font-medium text-bmc-700 bg-bmc-50 px-2 py-0.5 rounded">
                      {log.wardName}
                    </span>
                  )}
                  <span className="ml-auto text-[10px] text-[var(--neutral-400)]">
                    {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Worker info */}
                <div className="flex items-center gap-3 mb-1.5">
                  <p className="text-sm font-medium text-[var(--neutral-800)]">
                    {log.affectedUserId ? `${log.affectedUserId.name.first} ${log.affectedUserId.name.last}` : 'Unknown'}
                  </p>
                  <span className="text-[10px] font-mono text-[var(--neutral-400)]">
                    {log.affectedUserId?.employeeId || '-'}
                  </span>
                  <span className="text-[10px] text-[var(--neutral-500)]">
                    Route: <span className="font-medium text-[var(--neutral-700)]">{log.routeId?.name || 'Unknown'}</span>
                  </span>
                </div>

                {/* Message */}
                <p className="text-xs text-[var(--neutral-600)] mb-3 leading-relaxed">
                  {log.details.message}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {log.resolution?.status === 'open' && (
                    <>
                      <button
                        onClick={() => updateLogStatus(log._id, 'acknowledged')}
                        disabled={actionLoading === log._id}
                        className="px-3 py-1.5 text-[10px] font-medium border border-status-amber text-status-amber rounded hover:bg-status-amber-light disabled:opacity-60 transition-colors"
                      >
                        {actionLoading === log._id ? 'Updating...' : 'Acknowledge'}
                      </button>
                      <button
                        onClick={() => updateLogStatus(log._id, 'resolved')}
                        disabled={actionLoading === log._id}
                        className="px-3 py-1.5 text-[10px] font-medium border border-status-green text-status-green rounded hover:bg-status-green-light disabled:opacity-60 transition-colors"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => updateLogStatus(log._id, 'dismissed')}
                        disabled={actionLoading === log._id}
                        className="px-3 py-1.5 text-[10px] font-medium border border-[var(--neutral-300)] text-[var(--neutral-500)] rounded hover:bg-[var(--neutral-100)] disabled:opacity-60 transition-colors"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                  {log.resolution?.status === 'acknowledged' && (
                    <>
                      <button
                        onClick={() => updateLogStatus(log._id, 'resolved')}
                        disabled={actionLoading === log._id}
                        className="px-3 py-1.5 text-[10px] font-medium border border-status-green text-status-green rounded hover:bg-status-green-light disabled:opacity-60 transition-colors"
                      >
                        {actionLoading === log._id ? 'Updating...' : 'Resolve'}
                      </button>
                      <button
                        onClick={() => updateLogStatus(log._id, 'dismissed')}
                        disabled={actionLoading === log._id}
                        className="px-3 py-1.5 text-[10px] font-medium border border-[var(--neutral-300)] text-[var(--neutral-500)] rounded hover:bg-[var(--neutral-100)] disabled:opacity-60 transition-colors"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                  {log.geoPhotoId && (
                    <button
                      onClick={() => openPhoto(log.geoPhotoId!)}
                      disabled={photoLoading}
                      className="px-3 py-1.5 text-[10px] font-medium bg-bmc-700 text-white rounded hover:bg-bmc-800 disabled:opacity-60 transition-colors ml-auto"
                    >
                      {photoLoading ? 'Loading...' : 'View Photo'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs border border-[var(--border)] rounded bg-white text-[var(--neutral-600)] hover:bg-[var(--neutral-50)] disabled:opacity-40 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-[var(--neutral-500)]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs border border-[var(--border)] rounded bg-white text-[var(--neutral-600)] hover:bg-[var(--neutral-50)] disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Photo review modal */}
      {photoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold text-[var(--neutral-800)]">
                Photo Review &mdash; {photoModal.workerName}
              </h3>
              <button
                onClick={() => setPhotoModal(null)}
                className="text-[var(--neutral-400)] hover:text-[var(--neutral-600)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Photo comparison */}
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-[10px] text-[var(--neutral-500)] uppercase tracking-wider mb-2">Geotagged Photo</p>
                  <div className="aspect-square bg-[var(--neutral-100)] rounded-lg overflow-hidden flex items-center justify-center">
                    {photoModal.url ? (
                      <img
                        src={photoModal.url}
                        alt="Geotagged attendance photo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <p className="text-xs text-[var(--neutral-400)]">No photo available</p>
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--neutral-400)] mt-1">
                    Captured: {new Date(photoModal.capturedAt).toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--neutral-500)] uppercase tracking-wider mb-2">Profile Photo</p>
                  <div className="aspect-square bg-[var(--neutral-100)] rounded-lg overflow-hidden flex items-center justify-center">
                    {photoModal.profilePhotoUrl ? (
                      <img
                        src={photoModal.profilePhotoUrl}
                        alt="Worker profile photo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <p className="text-xs text-[var(--neutral-400)]">No profile photo</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Approve / Reject */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => handlePhotoAction(photoModal._id, 'rejected')}
                  className="px-4 py-2 text-xs font-medium border border-status-red text-status-red rounded hover:bg-status-red-light transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handlePhotoAction(photoModal._id, 'approved')}
                  className="px-4 py-2 text-xs font-medium bg-bmc-700 text-white rounded hover:bg-bmc-800 transition-colors"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
