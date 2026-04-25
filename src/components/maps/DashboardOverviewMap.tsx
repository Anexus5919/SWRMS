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
  routeProgress?: { status: string; completionPercentage: number };
}

interface DashboardOverviewMapProps {
  routes: RouteOverview[];
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
  height = '400px',
  defaultCenter = [19.0522, 72.8994], // Chembur center
  defaultZoom = 13,
}: DashboardOverviewMapProps) {
  const allPoints = useMemo(() => {
    const pts: [number, number][] = [];
    for (const r of routes) {
      pts.push([r.startPoint.lat, r.startPoint.lng]);
      pts.push([r.endPoint.lat, r.endPoint.lng]);
    }
    return pts;
  }, [routes]);

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

      {routes.map((r) => {
        const color = STATUS_COLOR[r.statusLabel] ?? STATUS_COLOR.adequate;
        const positions: [number, number][] = [
          [r.startPoint.lat, r.startPoint.lng],
          [r.endPoint.lat, r.endPoint.lng],
        ];

        return (
          <span key={r._id}>
            <Polyline
              positions={positions}
              pathOptions={{ color, weight: 4, opacity: 0.85 }}
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
