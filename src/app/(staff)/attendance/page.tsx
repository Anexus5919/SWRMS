'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

type CheckInState = 'idle' | 'locating' | 'submitting' | 'verified' | 'rejected' | 'already' | 'error';

interface AttendanceResult {
  status: string;
  distance: number;
  message: string;
  routeName?: string;
  routeCode?: string;
  checkInTime?: string;
}

export default function AttendancePage() {
  const { data: session } = useSession();
  const { position, loading: gpsLoading, error: gpsError, attempt, getPosition } = useGeolocation();
  const { addToQueue, queueLength, syncQueue, syncing } = useOfflineQueue();

  const [state, setState] = useState<CheckInState>('idle');
  const [result, setResult] = useState<AttendanceResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCheckIn = async () => {
    setState('locating');
    setResult(null);
    setErrorMsg('');

    const pos = await getPosition();

    if (!pos) {
      setState('error');
      setErrorMsg('Could not get GPS position. Please enable location services and try again.');
      return;
    }

    setState('submitting');

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates: {
            lat: pos.lat,
            lng: pos.lng,
            accuracy: pos.accuracy,
            attempts: 3,
          },
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.code === 'ALREADY_CHECKED_IN') {
          setState('already');
          return;
        }
        setState('error');
        setErrorMsg(data.error?.message || 'Failed to mark attendance');
        return;
      }

      setResult(data.data);
      setState(data.data.verified ? 'verified' : 'rejected');
    } catch {
      // Offline — queue for later
      addToQueue({
        coordinates: { lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy },
        routeId: session?.user?.assignedRouteId || '',
        timestamp: new Date().toISOString(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        },
      });
      setState('error');
      setErrorMsg('No network connection. Attendance queued for sync when online.');
    }
  };

  const getButtonStyle = () => {
    switch (state) {
      case 'verified':
        return 'border-status-green bg-status-green-light';
      case 'rejected':
        return 'border-status-red bg-status-red-light';
      case 'locating':
      case 'submitting':
        return 'border-bmc-400 bg-bmc-50 animate-pulse';
      case 'already':
        return 'border-status-amber bg-status-amber-light';
      default:
        return 'border-bmc-700 bg-bmc-50 hover:bg-bmc-100 active:scale-95';
    }
  };

  const getButtonContent = () => {
    switch (state) {
      case 'locating':
        return (
          <>
            <svg className="w-8 h-8 mx-auto text-bmc-600 animate-spin mb-1" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs text-bmc-600">Getting GPS...</span>
            <span className="text-[10px] text-bmc-400 mt-0.5">Attempt {attempt}/3</span>
          </>
        );
      case 'submitting':
        return (
          <>
            <svg className="w-8 h-8 mx-auto text-bmc-600 animate-spin mb-1" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs text-bmc-600">Verifying...</span>
          </>
        );
      case 'verified':
        return (
          <>
            <svg className="w-10 h-10 mx-auto text-status-green mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-status-green">Verified</span>
          </>
        );
      case 'rejected':
        return (
          <>
            <svg className="w-10 h-10 mx-auto text-status-red mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-status-red">Rejected</span>
          </>
        );
      case 'already':
        return (
          <>
            <svg className="w-10 h-10 mx-auto text-status-amber mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span className="text-sm font-semibold text-status-amber">Already Done</span>
          </>
        );
      default:
        return (
          <>
            <svg className="w-10 h-10 mx-auto text-bmc-700 mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="text-sm font-semibold text-bmc-700">Mark Attendance</span>
          </>
        );
    }
  };

  const isDisabled = state === 'locating' || state === 'submitting' || state === 'verified' || state === 'already';

  return (
    <div className="px-4 pt-6 flex flex-col items-center min-h-[calc(100vh-120px)]">
      {/* Employee info */}
      <p className="text-xs text-[var(--neutral-500)] mb-1 uppercase tracking-wider">
        {session?.user?.employeeId}
      </p>
      <p className="text-sm font-medium text-[var(--neutral-700)] mb-6">
        {session?.user?.name}
      </p>

      {/* Main check-in button */}
      <button
        onClick={handleCheckIn}
        disabled={isDisabled}
        className={`w-52 h-52 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 disabled:cursor-not-allowed ${getButtonStyle()}`}
      >
        {getButtonContent()}
      </button>

      {/* Result feedback */}
      {result && (
        <div className={`mt-6 w-full max-w-sm p-4 rounded-lg border ${
          result.status === 'verified'
            ? 'bg-status-green-light border-status-green/20'
            : 'bg-status-red-light border-status-red/20'
        }`}>
          <p className={`text-sm font-medium ${
            result.status === 'verified' ? 'text-status-green' : 'text-status-red'
          }`}>
            {result.message}
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-xs text-[var(--neutral-600)]">
              Route: {result.routeCode} — {result.routeName}
            </p>
            <p className="text-xs text-[var(--neutral-600)]">
              Distance from route: {result.distance}m
            </p>
            {result.checkInTime && (
              <p className="text-xs text-[var(--neutral-600)]">
                Time: {new Date(result.checkInTime).toLocaleTimeString('en-IN')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Already checked in */}
      {state === 'already' && (
        <div className="mt-6 w-full max-w-sm p-4 rounded-lg bg-status-amber-light border border-status-amber/20">
          <p className="text-sm font-medium text-status-amber">
            Attendance already marked for today.
          </p>
        </div>
      )}

      {/* Error message */}
      {state === 'error' && errorMsg && (
        <div className="mt-6 w-full max-w-sm p-4 rounded-lg bg-status-red-light border border-status-red/20">
          <p className="text-sm text-status-red">{errorMsg}</p>
          <button
            onClick={() => setState('idle')}
            className="mt-2 text-xs font-medium text-status-red underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* GPS accuracy info */}
      {position && (
        <p className="mt-4 text-[10px] text-[var(--neutral-400)]">
          GPS accuracy: ±{Math.round(position.accuracy)}m
        </p>
      )}

      {/* Offline queue indicator */}
      {queueLength > 0 && (
        <div className="mt-4 w-full max-w-sm p-3 rounded-lg bg-bmc-50 border border-bmc-100">
          <p className="text-xs text-bmc-700">
            {queueLength} attendance record{queueLength > 1 ? 's' : ''} queued offline
          </p>
          <button
            onClick={syncQueue}
            disabled={syncing}
            className="mt-1 text-xs font-medium text-bmc-600 underline"
          >
            {syncing ? 'Syncing...' : 'Sync now'}
          </button>
        </div>
      )}

      {/* Instructions */}
      <p className="mt-auto pb-4 text-[10px] text-[var(--neutral-400)] text-center max-w-xs leading-relaxed">
        Your GPS location is verified against your assigned route&apos;s geofence
        ({'\u2264'}200m radius). Ensure GPS is enabled and you are at your route starting point.
      </p>
    </div>
  );
}
