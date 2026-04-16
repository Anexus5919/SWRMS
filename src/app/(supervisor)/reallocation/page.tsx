'use client';

import { useEffect, useState } from 'react';

interface Suggestion {
  worker: { id: string; employeeId: string; name: string };
  fromRoute: { id: string; code: string; name: string };
  toRoute: { id: string; code: string; name: string };
  distanceKm: number;
  impactScore: number;
  fromRatio: number;
  toRatio: number;
}

interface ReallocationRecord {
  _id: string;
  workerId: { employeeId: string; name: { first: string; last: string } };
  fromRouteId: { code: string; name: string };
  toRouteId: { code: string; name: string };
  createdAt: string;
  status: string;
}

export default function ReallocationPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [history, setHistory] = useState<ReallocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [sugRes, histRes] = await Promise.all([
        fetch('/api/reallocation/suggestions'),
        fetch('/api/reallocation'),
      ]);

      const sugData = await sugRes.json();
      const histData = await histRes.json();

      if (sugData.success) setSuggestions(sugData.data);
      if (histData.success) setHistory(histData.data);
    } catch {
      setError('Failed to load reallocation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const approveReallocation = async (suggestion: Suggestion) => {
    setProcessing(suggestion.worker.id);

    try {
      const res = await fetch('/api/reallocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: suggestion.worker.id,
          fromRouteId: suggestion.fromRoute.id,
          toRouteId: suggestion.toRoute.id,
          distanceBetweenRoutes: suggestion.distanceKm,
          previousStaffingRatio: suggestion.toRatio,
        }),
      });

      if (res.ok) {
        // Remove from suggestions and refresh history
        setSuggestions((prev) => prev.filter((s) => s.worker.id !== suggestion.worker.id));
        fetchData();
      }
    } catch {
      setError('Failed to approve reallocation');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[var(--neutral-400)]">Loading reallocation data...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--neutral-800)]">
            Workforce Reallocation
          </h2>
          <p className="text-sm text-[var(--neutral-500)]">
            Redistribute idle workers from completed routes to understaffed routes.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 text-xs font-medium bg-bmc-700 text-white rounded hover:bg-bmc-800 transition-colors"
        >
          Refresh Suggestions
        </button>
      </div>

      {error && (
        <div className="mb-4 text-xs text-status-red bg-status-red-light border border-status-red/20 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {/* Suggestions */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-[var(--neutral-700)] mb-3 uppercase tracking-wider">
          Suggested Reallocations ({suggestions.length})
        </h3>

        {suggestions.length === 0 ? (
          <div className="bg-white border border-[var(--border)] rounded-lg p-6 text-center">
            <svg className="w-8 h-8 mx-auto text-status-green mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-[var(--neutral-600)]">
              No reallocation needed — all routes are adequately staffed.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => (
              <div
                key={s.worker.id}
                className="bg-white border border-[var(--border)] rounded-lg p-4 flex items-center gap-4"
              >
                {/* Worker info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--neutral-800)]">
                    {s.worker.name}
                  </p>
                  <p className="text-[10px] font-mono text-[var(--neutral-400)]">
                    {s.worker.employeeId}
                  </p>
                </div>

                {/* Transfer arrow */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold text-[var(--neutral-600)]">
                      {s.fromRoute.code}
                    </span>
                    <p className="text-[10px] text-status-green">ratio {s.fromRatio}</p>
                  </div>

                  <svg className="w-5 h-5 text-bmc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>

                  <div>
                    <span className="text-xs font-mono font-semibold text-status-red">
                      {s.toRoute.code}
                    </span>
                    <p className="text-[10px] text-status-red">ratio {s.toRatio}</p>
                  </div>
                </div>

                {/* Distance */}
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-[var(--neutral-500)]">{s.distanceKm} km</p>
                </div>

                {/* Actions */}
                <button
                  onClick={() => approveReallocation(s)}
                  disabled={processing === s.worker.id}
                  className="px-4 py-2 text-xs font-medium bg-bmc-700 text-white rounded hover:bg-bmc-800 disabled:opacity-60 transition-colors flex-shrink-0"
                >
                  {processing === s.worker.id ? 'Processing...' : 'Approve'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--neutral-700)] mb-3 uppercase tracking-wider">
          Today&apos;s Reallocations ({history.length})
        </h3>

        {history.length === 0 ? (
          <div className="bg-white border border-[var(--border)] rounded-lg p-4 text-center">
            <p className="text-xs text-[var(--neutral-400)]">No reallocations executed today.</p>
          </div>
        ) : (
          <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--neutral-50)] border-b border-[var(--border)]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Worker</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">From</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">To</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {history.map((record) => (
                  <tr key={record._id}>
                    <td className="px-4 py-3 text-xs">
                      {record.workerId?.name?.first} {record.workerId?.name?.last}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">{record.fromRouteId?.code}</td>
                    <td className="px-4 py-3 text-xs font-mono">{record.toRouteId?.code}</td>
                    <td className="px-4 py-3 text-xs text-[var(--neutral-500)]">
                      {new Date(record.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-status-green bg-status-green-light px-2 py-0.5 rounded">
                        {record.status}
                      </span>
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
