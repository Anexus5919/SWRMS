'use client';

import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { decodePolyline } from '@/lib/routing/osrm';

export interface ReplayPing {
  recordedAt: string | Date;
  lat: number;
  lng: number;
  accuracy: number | null;
  isOffRoute: boolean;
  distanceFromRouteMeters: number | null;
  mockLocation: boolean;
}

interface GPSReplayMapProps {
  pings: ReplayPing[];
  routePolyline?: string | null;
  startPoint?: { lat: number; lng: number; label?: string } | null;
  endPoint?: { lat: number; lng: number; label?: string } | null;
  /** Index into pings[] of the currently-selected ping (the "playhead"). */
  cursor: number;
  height?: string;
}

function FitToData({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 16);
      return;
    }
    const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
  }, [map, points]);

  return null;
}

/**
 * GPS replay map with a fixed playhead controlled externally via `cursor`.
 *
 * Rendering layers (z-order, bottom-up):
 *   1. Snapped route polyline (light blue, dashed when not snapped).
 *   2. Worker trail through cursor - full path travelled so far.
 *   3. Trail beyond cursor - faded so the supervisor can see "what's left".
 *   4. Off-route pings - small red rings.
 *   5. Mock-GPS pings - black-bordered red rings (highest priority).
 *   6. The current playhead - bigger blue circle with tooltip.
 */
export default function GPSReplayMap({
  pings,
  routePolyline = null,
  startPoint = null,
  endPoint = null,
  cursor,
  height = '500px',
}: GPSReplayMapProps) {
  // Decoded route polyline (or empty)
  const route = useMemo<[number, number][]>(() => {
    if (!routePolyline) return [];
    try {
      return decodePolyline(routePolyline);
    } catch {
      return [];
    }
  }, [routePolyline]);

  const trail = useMemo<[number, number][]>(
    () => pings.map((p) => [p.lat, p.lng] as [number, number]),
    [pings]
  );

  const before = useMemo(() => trail.slice(0, Math.min(cursor + 1, trail.length)), [trail, cursor]);
  const after = useMemo(() => trail.slice(Math.max(cursor, 0)), [trail, cursor]);

  const allPoints = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = [...trail, ...route];
    if (startPoint) pts.push([startPoint.lat, startPoint.lng]);
    if (endPoint) pts.push([endPoint.lat, endPoint.lng]);
    return pts;
  }, [trail, route, startPoint, endPoint]);

  const currentPing = pings[cursor] ?? null;
  const offRoute = useMemo(() => pings.filter((p) => p.isOffRoute), [pings]);
  const mock = useMemo(() => pings.filter((p) => p.mockLocation), [pings]);

  if (allPoints.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-[var(--neutral-100)] rounded-lg border border-[var(--border)]"
        style={{ height }}
      >
        <p className="text-xs text-[var(--neutral-500)]">No GPS data to show.</p>
      </div>
    );
  }

  const fallbackCenter: [number, number] = trail[0] ??
    (startPoint ? [startPoint.lat, startPoint.lng] : [19.0522, 72.8994]);

  return (
    <MapContainer
      center={fallbackCenter}
      zoom={15}
      style={{ height, width: '100%', borderRadius: '0.5rem' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitToData points={allPoints} />

      {/* Snapped route polyline (faded, behind worker trail). */}
      {route.length > 0 && (
        <Polyline
          positions={route}
          pathOptions={{ color: '#94a3b8', weight: 4, opacity: 0.6 }}
        />
      )}

      {/* Worker trail - past portion */}
      {before.length > 1 && (
        <Polyline
          positions={before}
          pathOptions={{ color: '#1d4ed8', weight: 4, opacity: 0.95 }}
        />
      )}

      {/* Worker trail - remaining portion (faded) */}
      {after.length > 1 && (
        <Polyline
          positions={after}
          pathOptions={{ color: '#1d4ed8', weight: 3, opacity: 0.25, dashArray: '4 4' }}
        />
      )}

      {/* Start / end markers if available */}
      {startPoint && (
        <CircleMarker
          center={[startPoint.lat, startPoint.lng]}
          radius={6}
          pathOptions={{ color: '#15803d', fillColor: '#15803d', fillOpacity: 1, weight: 2 }}
        >
          <Tooltip direction="top">
            <strong>Start</strong>{startPoint.label ? <><br />{startPoint.label}</> : null}
          </Tooltip>
        </CircleMarker>
      )}
      {endPoint && (
        <CircleMarker
          center={[endPoint.lat, endPoint.lng]}
          radius={6}
          pathOptions={{ color: '#b91c1c', fillColor: '#fff', fillOpacity: 1, weight: 2 }}
        >
          <Tooltip direction="top">
            <strong>End</strong>{endPoint.label ? <><br />{endPoint.label}</> : null}
          </Tooltip>
        </CircleMarker>
      )}

      {/* Off-route pings */}
      {offRoute.map((p, i) => (
        <CircleMarker
          key={`offroute-${i}`}
          center={[p.lat, p.lng]}
          radius={4}
          pathOptions={{ color: '#b91c1c', fillColor: '#fee2e2', fillOpacity: 0.85, weight: 2 }}
        >
          <Tooltip direction="top">
            Off route - {p.distanceFromRouteMeters ?? '?'}m
          </Tooltip>
        </CircleMarker>
      ))}

      {/* Mock-location pings (over off-route) */}
      {mock.map((p, i) => (
        <CircleMarker
          key={`mock-${i}`}
          center={[p.lat, p.lng]}
          radius={5}
          pathOptions={{ color: '#000', fillColor: '#fca5a5', fillOpacity: 1, weight: 2 }}
        >
          <Tooltip direction="top">
            <strong>Mock-GPS flag</strong>
          </Tooltip>
        </CircleMarker>
      ))}

      {/* Playhead */}
      {currentPing && (
        <CircleMarker
          center={[currentPing.lat, currentPing.lng]}
          radius={9}
          pathOptions={{
            color: currentPing.isOffRoute ? '#b91c1c' : '#1d4ed8',
            fillColor: currentPing.isOffRoute ? '#fecaca' : '#bfdbfe',
            fillOpacity: 1,
            weight: 3,
          }}
        >
          <Tooltip direction="top" permanent>
            <div className="text-xs">
              <strong>
                {new Date(currentPing.recordedAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </strong>
              <br />
              {currentPing.isOffRoute ? (
                <span style={{ color: '#b91c1c' }}>
                  {currentPing.distanceFromRouteMeters ?? '?'}m off route
                </span>
              ) : (
                <span style={{ color: '#1d4ed8' }}>On route</span>
              )}
              {currentPing.mockLocation && (
                <>
                  <br />
                  <strong style={{ color: '#000' }}>Mock-GPS detected</strong>
                </>
              )}
            </div>
          </Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
