'use client';

import { useEffect, useMemo } from 'react';
import { useLiveTracking } from '@/hooks/useLiveTracking';

interface TrackingCardProps {
  /** Worker has verified attendance — gates the Start button. */
  attendanceVerified: boolean;
  /** Worker's RouteProgress is 'completed' — auto-stop tracking. */
  routeCompleted: boolean;
  /** Worker's shift end time (HH:MM IST). Used to auto-stop tracking. */
  shiftEnd?: string;
}

function todayShiftEnd(shiftEnd?: string): Date | null {
  if (!shiftEnd) return null;
  const [h, m] = shiftEnd.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Tracking card on the staff home page.
 *
 * Privacy contract surfaced here so the worker sees it before opt-in:
 *  - Tracking only runs after they press "Start Shift".
 *  - The pulsing green dot is the "Tracking: ON" indicator.
 *  - They can press "Stop Shift" any time.
 *  - GPS auto-stops at shiftEnd and on route completion.
 */
export default function TrackingCard({
  attendanceVerified,
  routeCompleted,
  shiftEnd,
}: TrackingCardProps) {
  const stopAt = useMemo(() => todayShiftEnd(shiftEnd), [shiftEnd]);
  const { status, start, stop } = useLiveTracking({ stopAt });

  // Auto-stop if the route flips to completed (someone marked 100% from another tab/device).
  useEffect(() => {
    if (routeCompleted && status.state === 'tracking') {
      stop();
    }
  }, [routeCompleted, status.state, stop]);

  const isOn = status.state === 'tracking' || status.state === 'starting';
  const canStart = attendanceVerified && !routeCompleted;

  return (
    <div className="mt-4 rounded-lg border border-[var(--border)] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isOn ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'
              }`}
              aria-hidden
            />
            <h3 className="text-sm font-semibold text-[var(--neutral-800)]">
              Live Tracking
            </h3>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                isOn
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                  : 'text-gray-500 bg-gray-100'
              }`}
            >
              {isOn ? 'ON' : 'OFF'}
            </span>
          </div>
          <p className="text-xs text-[var(--neutral-500)] mt-1.5 leading-relaxed">
            {isOn
              ? 'Your location is being shared with your supervisor while you complete the route.'
              : 'Press Start Shift to share your location with the supervisor while you work. You can stop any time.'}
          </p>
        </div>
      </div>

      {/* Status line */}
      {isOn && (
        <div
          className={`mt-3 px-3 py-2 rounded text-xs ${
            status.isOffRoute
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
          }`}
        >
          {status.isOffRoute ? (
            <span>
              <strong>Off route</strong> &mdash; you are{' '}
              {status.distanceFromRouteMeters
                ? `${status.distanceFromRouteMeters}m`
                : 'far'}{' '}
              from the assigned path. Return to the route.
            </span>
          ) : (
            <span>
              <strong>On route</strong>
              {status.distanceFromRouteMeters !== null
                ? ` (${status.distanceFromRouteMeters}m from path)`
                : ''}
              {status.lastPingAt
                ? ` — last update ${status.lastPingAt.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : ''}
            </span>
          )}
        </div>
      )}

      {/* Mock-location warning */}
      {status.mockLocationDetected && (
        <div className="mt-3 px-3 py-2 rounded text-xs bg-red-50 border border-red-300 text-red-800">
          <strong>Warning:</strong> Your device is reporting a mock-location flag. This
          will be reviewed by the supervisor. If you have a fake-GPS app installed,
          please disable it.
        </div>
      )}

      {/* Paused / error */}
      {status.state === 'paused' && status.error && (
        <p className="mt-3 text-[11px] text-amber-700">
          Paused: {status.error}. Will retry on next interval.
        </p>
      )}

      {/* Action button */}
      <div className="mt-3">
        {!isOn ? (
          <button
            type="button"
            onClick={start}
            disabled={!canStart}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.97]"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
              />
            </svg>
            {canStart
              ? 'Start Shift Tracking'
              : routeCompleted
                ? 'Route Completed'
                : 'Mark Attendance First'}
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-white text-red-600 border border-red-200 hover:bg-red-50 transition-colors active:scale-[0.97]"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z"
              />
            </svg>
            Stop Tracking
          </button>
        )}
      </div>
    </div>
  );
}
