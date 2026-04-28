'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface ProgressData {
  status: string;
  completionPercentage: number;
  updates: { time: string; percentage: number; note?: string }[];
}

const PROGRESS_STEPS = [0, 25, 50, 75, 100];

export default function ProgressPage() {
  const { data: session } = useSession();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const routeId = session?.user?.assignedRouteId;

  useEffect(() => {
    if (!routeId) {
      setLoading(false);
      return;
    }

    fetch(`/api/routes/${routeId}/progress`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProgress(data.data);
      })
      .catch(() => setError('Failed to load progress'))
      .finally(() => setLoading(false));
  }, [routeId]);

  const updateProgress = async (percentage: number) => {
    if (!routeId || updating) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/routes/${routeId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completionPercentage: percentage,
          note: note || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProgress(data.data);
        setNote('');
      }
    } catch {
      setError('Failed to update progress');
    } finally {
      setUpdating(false);
    }
  };

  // Save the note WITHOUT changing the percentage. Important after a route
  // is at 100% (all quick-update buttons are disabled) and for any case
  // where the worker just wants to leave a comment for the supervisor
  // (e.g. "heavy rain", "vehicle breakdown") without bumping progress.
  const saveNoteOnly = async () => {
    if (!routeId || updating || !note.trim()) return;

    setUpdating(true);
    setError('');
    try {
      const res = await fetch(`/api/routes/${routeId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // Note: no completionPercentage field - the server preserves the
        // current value but pushes a fresh updates row with the note.
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (data.success) {
        setProgress(data.data);
        setNote('');
      } else {
        setError(data.error?.message ?? 'Failed to save note');
      }
    } catch {
      setError('Failed to save note');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 pt-6 flex items-center justify-center h-48">
        <p className="text-sm text-[var(--neutral-400)]">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 pt-6">
        <h2 className="text-lg font-semibold text-[var(--neutral-800)] mb-4">
          Route Progress
        </h2>
        <div className="bg-white border border-status-red/20 rounded-lg p-6 text-center">
          <p className="text-sm text-status-red">{error}</p>
        </div>
      </div>
    );
  }

  if (!routeId) {
    return (
      <div className="px-4 pt-6">
        <h2 className="text-lg font-semibold text-[var(--neutral-800)] mb-4">
          Route Progress
        </h2>
        <div className="bg-white border border-[var(--border)] rounded-lg p-6 text-center">
          <p className="text-sm text-[var(--neutral-500)]">No route assigned.</p>
        </div>
      </div>
    );
  }

  const currentPct = progress?.completionPercentage || 0;

  return (
    <div className="px-4 pt-4">
      <h2 className="text-lg font-semibold text-[var(--neutral-800)] mb-1">
        Route Progress
      </h2>
      <p className="text-xs text-[var(--neutral-500)] mb-6">
        Update your collection progress for today
      </p>

      {error && (
        <div className="mb-4 text-xs text-status-red bg-status-red-light border border-status-red/20 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {/* Progress bar */}
      <div className="bg-white border border-[var(--border)] rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--neutral-700)]">
            Completion
          </span>
          <span className="text-lg font-bold text-bmc-700">{currentPct}%</span>
        </div>
        <div className="h-3 bg-[var(--neutral-100)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${currentPct}%`,
              backgroundColor: currentPct >= 100 ? 'var(--status-green)' : 'var(--bmc-700)',
            }}
          />
        </div>
        <p className="mt-2 text-[10px] text-[var(--neutral-400)] uppercase tracking-wider">
          Status: {progress?.status?.replace('_', ' ') || 'not started'}
        </p>
      </div>

      {/* Quick update buttons */}
      <div className="bg-white border border-[var(--border)] rounded-lg p-4 mb-4">
        <p className="text-xs font-medium text-[var(--neutral-600)] mb-3 uppercase tracking-wider">
          Quick Update
        </p>
        <div className="grid grid-cols-5 gap-2">
          {PROGRESS_STEPS.map((pct) => (
            <button
              key={pct}
              onClick={() => updateProgress(pct)}
              disabled={updating || pct < currentPct}
              className={`py-3 rounded text-xs font-semibold transition-colors ${
                pct === currentPct
                  ? 'bg-bmc-700 text-white'
                  : pct < currentPct
                  ? 'bg-bmc-100 text-bmc-400 cursor-not-allowed'
                  : 'bg-[var(--neutral-50)] border border-[var(--border)] text-[var(--neutral-700)] hover:bg-bmc-50 hover:border-bmc-200'
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      {/* Note input + send button. The note auto-attaches to the next
          quick-update click; the explicit Send button is for the cases
          where the route is already at 100% (all % buttons disabled) or
          the worker just wants to leave a comment without bumping progress. */}
      <div className="bg-white border border-[var(--border)] rounded-lg p-4 mb-4">
        <label className="block text-xs font-medium text-[var(--neutral-600)] mb-2 uppercase tracking-wider">
          Add Note (optional)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && note.trim() && !updating) {
                e.preventDefault();
                saveNoteOnly();
              }
            }}
            placeholder="e.g. Heavy traffic on main road"
            className="flex-1 min-w-0 px-3 py-2 text-sm border border-[var(--border)] rounded bg-[var(--neutral-50)] placeholder:text-[var(--neutral-400)] focus:outline-none focus:ring-2 focus:ring-bmc-500/30"
          />
          <button
            type="button"
            onClick={saveNoteOnly}
            disabled={updating || !note.trim()}
            className="px-4 py-2 text-xs font-semibold rounded bg-bmc-700 text-white hover:bg-bmc-800 disabled:bg-[var(--neutral-200)] disabled:text-[var(--neutral-400)] disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {updating ? 'Saving…' : 'Send to supervisor'}
          </button>
        </div>
        <p className="mt-2 text-[10px] text-[var(--neutral-400)] leading-relaxed">
          Tip: a note will also attach to the next % update if you click one of the buttons above.
        </p>
      </div>

      {/* Update log */}
      {progress?.updates && progress.updates.length > 0 && (
        <div className="bg-white border border-[var(--border)] rounded-lg p-4">
          <p className="text-xs font-medium text-[var(--neutral-600)] mb-3 uppercase tracking-wider">
            Today&apos;s Updates
          </p>
          <div className="space-y-2">
            {[...progress.updates].reverse().map((update, i) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <span className="text-[var(--neutral-400)] whitespace-nowrap">
                  {new Date(update.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="font-medium text-[var(--neutral-700)]">
                  {update.percentage}%
                </span>
                {update.note && (
                  <span className="text-[var(--neutral-500)]">{update.note}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
