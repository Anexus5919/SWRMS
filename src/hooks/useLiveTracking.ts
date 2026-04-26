'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type TrackingState = 'idle' | 'starting' | 'tracking' | 'paused' | 'error';

export interface TrackingStatus {
  state: TrackingState;
  /** Most recent server-acknowledged ping timestamp. */
  lastPingAt: Date | null;
  /** From the last server response. */
  isOffRoute: boolean;
  /** From the last server response. */
  distanceFromRouteMeters: number | null;
  /** Last error string the hook surfaced. */
  error: string | null;
  /** True if the device claimed mock-location on its last reported sample. */
  mockLocationDetected: boolean;
}

interface Options {
  /** ms between location samples. Default 30000 (30s). */
  intervalMs?: number;
  /** Auto-stop tracking at this Date (e.g. shiftEnd). Optional. */
  stopAt?: Date | null;
}

const DEFAULT_INTERVAL = 30_000;

/**
 * useLiveTracking - opt-in continuous GPS reporting from the staff PWA.
 *
 * The worker explicitly calls start() when they begin their shift and stop()
 * at the end. While active, the hook samples geolocation every `intervalMs`,
 * POSTs each sample to /api/tracking/ping, and exposes the server's reply
 * so the UI can show "On route" / "Off route - return to your route".
 *
 * If a sample fails (no GPS fix, network error), the hook keeps trying on
 * the next interval rather than aborting. The PAUSED state surfaces in the UI.
 *
 * Privacy:
 *  - Tracking only runs when start() was called by the worker.
 *  - The component using this hook should render a clear on-screen
 *    "Tracking: ON" indicator while state === 'tracking'.
 *  - stop() must be called in cleanup or the geolocation watch leaks.
 */
export function useLiveTracking(options: Options = {}) {
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL;

  const [status, setStatus] = useState<TrackingStatus>({
    state: 'idle',
    lastPingAt: null,
    isOffRoute: false,
    distanceFromRouteMeters: null,
    error: null,
    mockLocationDetected: false,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const stopRequested = useRef(false);

  const sendOnePing = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus((s) => ({ ...s, state: 'error', error: 'Geolocation not supported' }));
      return;
    }

    const position = await new Promise<GeolocationPosition | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 12_000, maximumAge: 5_000 }
      );
    });

    if (!position) {
      setStatus((s) => ({ ...s, state: 'paused', error: 'GPS unavailable' }));
      return;
    }

    const { latitude, longitude, accuracy, speed, heading } = position.coords;
    const clientTime = new Date(position.timestamp).toISOString();

    // Best-effort mock-location flag. Only Android exposes this on
    // GeolocationCoordinates; treat undefined as false.
    const mockLocation = Boolean(
      (position.coords as { isFromMockProvider?: boolean }).isFromMockProvider
    );

    try {
      const res = await fetch('/api/tracking/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates: {
            lat: latitude,
            lng: longitude,
            accuracy: accuracy ?? null,
            speedMps: speed ?? null,
            heading: heading ?? null,
          },
          clientTime,
          mockLocation,
          deviceInfo: {
            userAgent:
              typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : '',
            platform:
              typeof navigator !== 'undefined' ? navigator.platform.slice(0, 50) : '',
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStatus({
          state: 'tracking',
          lastPingAt: new Date(),
          isOffRoute: Boolean(json.data?.isOffRoute),
          distanceFromRouteMeters: json.data?.distanceFromRouteMeters ?? null,
          error: null,
          mockLocationDetected: mockLocation,
        });
      } else {
        const code = json.error?.code;
        if (code === 'NOT_ON_SHIFT' || code === 'SHIFT_ENDED') {
          // These are terminal - stop ourselves rather than retrying.
          stopRequested.current = true;
          setStatus((s) => ({
            ...s,
            state: 'idle',
            error: json.error?.message ?? 'Tracking stopped',
          }));
        } else {
          setStatus((s) => ({
            ...s,
            state: 'paused',
            error: json.error?.message ?? 'Ping failed',
          }));
        }
      }
    } catch (err) {
      setStatus((s) => ({
        ...s,
        state: 'paused',
        error: (err as Error).message ?? 'Network error',
      }));
    }
  }, []);

  const start = useCallback(() => {
    if (timerRef.current) return; // already tracking
    stopRequested.current = false;
    setStatus((s) => ({ ...s, state: 'starting', error: null }));
    // Immediate first ping so user sees feedback right away.
    void sendOnePing();
    timerRef.current = setInterval(() => {
      if (stopRequested.current) return;
      // Auto-stop at stopAt if provided.
      if (options.stopAt && Date.now() >= options.stopAt.getTime()) {
        stop();
        return;
      }
      void sendOnePing();
    }, intervalMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendOnePing, intervalMs, options.stopAt]);

  const stop = useCallback(() => {
    stopRequested.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
      navigator.geolocation?.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus((s) => ({ ...s, state: 'idle' }));
  }, []);

  // Cleanup on unmount.
  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { status, start, stop };
}
