'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import DynamicRouteMap from '@/components/maps/DynamicRouteMap';

interface RouteData {
  _id: string;
  name: string;
  code: string;
  startPoint: { lat: number; lng: number; label?: string };
  endPoint: { lat: number; lng: number; label?: string };
  waypoints: { lat: number; lng: number; order: number }[];
  estimatedLengthKm: number;
  requiredStaff: number;
  geofenceRadius: number;
  shiftStart: string;
  shiftEnd: string;
  routePolyline?: string | null;
  routeDistanceKm?: number | null;
  routeDurationMinutes?: number | null;
}

export default function MyRoutePage() {
  const { data: session } = useSession();
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session?.user?.assignedRouteId) {
      setLoading(false);
      return;
    }

    fetch(`/api/routes/${session.user.assignedRouteId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setRoute(data.data);
      })
      .catch(() => setError('Failed to load route'))
      .finally(() => setLoading(false));
  }, [session]);

  if (loading) {
    return (
      <div className="px-4 pt-6 flex items-center justify-center h-48">
        <p className="text-sm text-[var(--neutral-400)]">Loading route...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 pt-6">
        <h2 className="text-lg font-semibold text-[var(--neutral-800)] mb-4">
          My Assigned Route
        </h2>
        <div className="bg-white border border-status-red/20 rounded-lg p-6 text-center">
          <p className="text-sm text-status-red">{error}</p>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="px-4 pt-6">
        <h2 className="text-lg font-semibold text-[var(--neutral-800)] mb-4">
          My Assigned Route
        </h2>
        <div className="bg-white border border-[var(--border)] rounded-lg p-6 text-center">
          <p className="text-sm text-[var(--neutral-500)]">
            No route assigned. Contact your supervisor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4">
      {/* Route header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-mono font-bold text-bmc-700 bg-bmc-50 px-2 py-1 rounded">
          {route.code}
        </span>
        <h2 className="text-base font-semibold text-[var(--neutral-800)]">
          {route.name}
        </h2>
      </div>

      {/* Map */}
      <DynamicRouteMap
        startPoint={route.startPoint}
        endPoint={route.endPoint}
        waypoints={route.waypoints}
        geofenceRadius={route.geofenceRadius}
        routePolyline={route.routePolyline}
        height="250px"
      />

      {/* Route details */}
      <div className="mt-4 bg-white border border-[var(--border)] rounded-lg divide-y divide-[var(--border)]">
        <div className="flex justify-between px-4 py-3">
          <span className="text-xs text-[var(--neutral-500)]">Distance</span>
          <span className="text-xs font-medium text-[var(--neutral-800)]">{route.estimatedLengthKm} km</span>
        </div>
        <div className="flex justify-between px-4 py-3">
          <span className="text-xs text-[var(--neutral-500)]">Required Staff</span>
          <span className="text-xs font-medium text-[var(--neutral-800)]">{route.requiredStaff} workers</span>
        </div>
        <div className="flex justify-between px-4 py-3">
          <span className="text-xs text-[var(--neutral-500)]">Geofence Radius</span>
          <span className="text-xs font-medium text-[var(--neutral-800)]">{route.geofenceRadius}m</span>
        </div>
        <div className="flex justify-between px-4 py-3">
          <span className="text-xs text-[var(--neutral-500)]">Shift</span>
          <span className="text-xs font-medium text-[var(--neutral-800)]">{route.shiftStart} - {route.shiftEnd}</span>
        </div>
        <div className="flex justify-between px-4 py-3">
          <span className="text-xs text-[var(--neutral-500)]">Start Point</span>
          <span className="text-xs font-medium text-[var(--neutral-800)]">{route.startPoint.label || 'N/A'}</span>
        </div>
        <div className="flex justify-between px-4 py-3">
          <span className="text-xs text-[var(--neutral-500)]">End Point</span>
          <span className="text-xs font-medium text-[var(--neutral-800)]">{route.endPoint.label || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}
