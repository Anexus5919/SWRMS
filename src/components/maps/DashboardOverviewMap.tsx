'use client';

import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { decodePolyline } from '@/lib/routing/osrm';

interface RouteOverview {
  _id: string;
  code: string;
  name: string;
  startPoint: { lat: number; lng: number; label?: string };
  endPoint: { lat: number; lng: number; label?: string };
  presentStaff: number;
  requiredStaff: number;
  staffingRatio: number;
  statusLabel: 'adequate' | 'marginal' | 'critical';
  routePolyline?: string | null;
  routeProgress?: { status: string; completionPercentage: number };
}

export interface LiveWorkerPosition {
  userId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  routeId: string;
  coordinates: { lat: number; lng: number; accuracy?: number | null };
  recordedAt: string | Date;
  isOffRoute: boolean;
  distanceFromRouteMeters: number | null;
}

interface DashboardOverviewMapProps {
  routes: RouteOverview[];
  /** Latest GPS ping per active worker. Empty array = no live data. */
  livePositions?: LiveWorkerPosition[];
  height?: string;
  /** Pre-fit zoom; map auto-fits to all routes after mount. */
  defaultCenter?: [number, number];
  defaultZoom?: number;
}

const STATUS_COLOR: Record<RouteOverview['statusLabel'], string> = {
  adequate: '#15803d', // green-700
  marginal: '#b45309', // amber-700
  critical: '#b91c1c', // red-700
};

function FitToRoutes({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, points]);

  return null;
}

/**
 * Multi-route overview for the supervisor dashboard.
 * - Each route is rendered as a colored polyline (green/amber/red by staffing).
 * - Start and end points are circle markers with tooltips.
 * - Click a polyline / marker to see route code + staffing in a tooltip.
 *
 * Currently the polyline is a straight line between start and end. Phase 3
 * adds road-snapping via OSRM and replaces this polyline with the
 * `routePolyline` (encoded) stored on the Route document.
 */
export default function DashboardOverviewMap({
  routes,
  livePositions = [],
  height = '400px',
  defaultCenter = [19.0522, 72.8994], // Chembur center
  defaultZoom = 13,
}: DashboardOverviewMapProps) {
  // Compute the polyline for each route once. Snapped polyline if the
  // Route doc has one, straight start→end fallback otherwise.
  const routesWithPolylines = useMemo(() => {
    return routes.map((r) => {
      let polyline: [number, number][] | null = null;
      if (r.routePolyline) {
        try {
          polyline = decodePolyline(r.routePolyline);
        } catch {
          polyline = null;
        }
      }
      const positions: [number, number][] = polyline ?? [
        [r.startPoint.lat, r.startPoint.lng],
        [r.endPoint.lat, r.endPoint.lng],
      ];
      return { route: r, positions, snapped: polyline !== null };
    });
  }, [routes]);

  const allPoints = useMemo(() => {
    const pts: [number, number][] = [];
    for (const item of routesWithPolylines) {
      pts.push(...item.positions);
    }
    return pts;
  }, [routesWithPolylines]);

  if (routes.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-[var(--neutral-100)] rounded-lg border border-[var(--border)]"
        style={{ height }}
      >
        <p className="text-xs text-[var(--neutral-500)]">No active routes to show on the map.</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height, width: '100%', borderRadius: '0.5rem' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitToRoutes points={allPoints} />

      {/* Live worker pins. Off-route workers get a red highlight ring. */}
      {livePositions.map((w) => (
        <CircleMarker
          key={`worker-${w.userId}`}
          center={[w.coordinates.lat, w.coordinates.lng]}
          radius={8}
          pathOptions={{
            color: w.isOffRoute ? '#b91c1c' : '#1d4ed8',
            fillColor: w.isOffRoute ? '#fee2e2' : '#dbeafe',
            fillOpacity: 1,
            weight: 3,
          }}
        >
          <Tooltip direction="top">
            <div className="text-xs">
              <strong>
                {w.firstName} {w.lastName}
              </strong>{' '}
              <span className="font-mono text-[10px]">({w.employeeId})</span>
              <br />
              {w.isOffRoute ? (
                <span style={{ color: '#b91c1c' }}>
                  Off route &mdash; {w.distanceFromRouteMeters ?? '?'}m from path
                </span>
              ) : (
                <span style={{ color: '#1d4ed8' }}>On route</span>
              )}
              <br />
              <span className="text-[10px]">
                Last update:{' '}
                {new Date(w.recordedAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}

      {routesWithPolylines.map(({ route: r, positions, snapped }) => {
        const color = STATUS_COLOR[r.statusLabel] ?? STATUS_COLOR.adequate;

        return (
          <span key={r._id}>
            <Polyline
              positions={positions}
              pathOptions={{
                color,
                weight: 4,
                opacity: 0.85,
                dashArray: snapped ? undefined : '8 6',
              }}
            >
              <Tooltip sticky direction="top">
                <div className="text-xs">
                  <strong>{r.code}</strong> &mdash; {r.name}
                  <br />
                  Staff: {r.presentStaff}/{r.requiredStaff} ({Math.round(r.staffingRatio * 100)}%)
                  {r.routeProgress && (
                    <>
                      <br />
                      Progress: {r.routeProgress.completionPercentage}% &middot; {r.routeProgress.status.replace('_', ' ')}
                    </>
                  )}
                </div>
              </Tooltip>
            </Polyline>
            <CircleMarker
              center={[r.startPoint.lat, r.startPoint.lng]}
              radius={6}
              pathOptions={{ color, fillColor: color, fillOpacity: 1, weight: 2 }}
            >
              <Tooltip direction="top">
                <strong>Start: {r.code}</strong>
                {r.startPoint.label ? <><br />{r.startPoint.label}</> : null}
              </Tooltip>
            </CircleMarker>
            <CircleMarker
              center={[r.endPoint.lat, r.endPoint.lng]}
              radius={5}
              pathOptions={{ color, fillColor: '#fff', fillOpacity: 1, weight: 2 }}
            >
              <Tooltip direction="top">
                <strong>End: {r.code}</strong>
                {r.endPoint.label ? <><br />{r.endPoint.label}</> : null}
              </Tooltip>
            </CircleMarker>
          </span>
        );
      })}
    </MapContainer>
  );
}
