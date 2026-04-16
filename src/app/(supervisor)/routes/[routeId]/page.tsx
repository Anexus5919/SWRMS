'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DynamicRouteMap from '@/components/maps/DynamicRouteMap';

interface RouteDetail {
  _id: string;
  name: string;
  code: string;
  startPoint: { lat: number; lng: number; label?: string };
  endPoint: { lat: number; lng: number; label?: string };
  waypoints: { lat: number; lng: number }[];
  estimatedLengthKm: number;
  requiredStaff: number;
  geofenceRadius: number;
  shiftStart: string;
  shiftEnd: string;
}

interface AttendanceRecord {
  _id: string;
  userId: { employeeId: string; name: { first: string; last: string } };
  checkInTime: string;
  distanceFromRoute: number;
  status: string;
}

export default function RouteDetailPage() {
  const params = useParams();
  const routeId = params.routeId as string;

  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/routes/${routeId}`).then((r) => r.json()),
      fetch(`/api/attendance?routeId=${routeId}`).then((r) => r.json()),
    ])
      .then(([routeData, attData]) => {
        if (routeData.success) setRoute(routeData.data);
        if (attData.success) setAttendance(attData.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [routeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-sm text-[var(--neutral-400)]">Loading...</p>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-[var(--neutral-500)]">Route not found.</p>
        <Link href="/dashboard" className="text-xs text-bmc-600 underline mt-2 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const verified = attendance.filter((a) => a.status === 'verified');
  const rejected = attendance.filter((a) => a.status === 'rejected');

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link href="/dashboard" className="text-xs text-bmc-600 hover:underline">
          Dashboard
        </Link>
        <span className="text-xs text-[var(--neutral-400)] mx-2">/</span>
        <span className="text-xs text-[var(--neutral-600)]">{route.code}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm font-mono font-bold text-bmc-700 bg-bmc-50 px-3 py-1 rounded">
          {route.code}
        </span>
        <h2 className="text-lg font-semibold text-[var(--neutral-800)]">{route.name}</h2>
      </div>

      {/* Map */}
      <DynamicRouteMap
        startPoint={route.startPoint}
        endPoint={route.endPoint}
        waypoints={route.waypoints}
        geofenceRadius={route.geofenceRadius}
        height="280px"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Route info */}
        <div className="bg-white border border-[var(--border)] rounded-lg divide-y divide-[var(--border)]">
          <div className="px-4 py-3 bg-[var(--neutral-50)]">
            <h3 className="text-xs font-semibold text-[var(--neutral-600)] uppercase tracking-wider">Route Details</h3>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-xs text-[var(--neutral-500)]">Distance</span>
            <span className="text-xs font-medium">{route.estimatedLengthKm} km</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-xs text-[var(--neutral-500)]">Required Staff</span>
            <span className="text-xs font-medium">{route.requiredStaff}</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-xs text-[var(--neutral-500)]">Present Today</span>
            <span className="text-xs font-semibold text-status-green">{verified.length}</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-xs text-[var(--neutral-500)]">Geofence</span>
            <span className="text-xs font-medium">{route.geofenceRadius}m</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-xs text-[var(--neutral-500)]">Shift</span>
            <span className="text-xs font-medium">{route.shiftStart} — {route.shiftEnd}</span>
          </div>
        </div>

        {/* Staff attendance today */}
        <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-[var(--neutral-50)] border-b border-[var(--border)]">
            <h3 className="text-xs font-semibold text-[var(--neutral-600)] uppercase tracking-wider">
              Today&apos;s Attendance ({verified.length} verified, {rejected.length} rejected)
            </h3>
          </div>
          {attendance.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-[var(--neutral-400)]">
              No attendance records yet.
            </p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {attendance.map((a) => (
                <div key={a._id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[var(--neutral-800)]">
                      {a.userId?.name?.first} {a.userId?.name?.last}
                    </p>
                    <p className="text-[10px] font-mono text-[var(--neutral-400)]">
                      {a.userId?.employeeId}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                        a.status === 'verified'
                          ? 'text-status-green bg-status-green-light'
                          : 'text-status-red bg-status-red-light'
                      }`}
                    >
                      {a.status}
                    </span>
                    <p className="text-[10px] text-[var(--neutral-400)] mt-0.5">
                      {a.distanceFromRoute}m — {new Date(a.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
