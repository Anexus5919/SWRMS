'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { decodePolyline } from '@/lib/routing/osrm';

// Fix default marker icon issue in Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface RoutePoint {
  lat: number;
  lng: number;
  label?: string;
}

interface RouteMapProps {
  startPoint: RoutePoint;
  endPoint: RoutePoint;
  waypoints?: RoutePoint[];
  geofenceRadius?: number;
  workerPosition?: { lat: number; lng: number } | null;
  height?: string;
  statusColor?: string;
  /**
   * Encoded polyline (Google polyline algorithm, precision 5) - typically
   * computed by OSRM and stored on the Route document. When present, the
   * map renders the road-snapped path instead of the straight start→end line.
   */
  routePolyline?: string | null;
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [map, points]);

  return null;
}

export default function RouteMap({
  startPoint,
  endPoint,
  waypoints = [],
  geofenceRadius = 200,
  workerPosition = null,
  height = '300px',
  statusColor = '#1a4480',
  routePolyline = null,
}: RouteMapProps) {
  // Decode the encoded polyline if provided. Fall back to straight-line
  // start → waypoints → end when the route hasn't been road-snapped yet.
  const polylinePoints = useMemo<[number, number][]>(() => {
    if (routePolyline) {
      try {
        return decodePolyline(routePolyline);
      } catch {
        // Bad polyline string - fall through to straight-line fallback.
      }
    }
    return [
      [startPoint.lat, startPoint.lng],
      ...waypoints.map((wp) => [wp.lat, wp.lng] as [number, number]),
      [endPoint.lat, endPoint.lng],
    ];
  }, [routePolyline, startPoint, endPoint, waypoints]);

  const center: [number, number] = [startPoint.lat, startPoint.lng];
  const isSnapped = polylinePoints.length > waypoints.length + 2;

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height, width: '100%', borderRadius: '0.5rem' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds points={polylinePoints} />

      {/* Geofence circle at start point */}
      <Circle
        center={[startPoint.lat, startPoint.lng]}
        radius={geofenceRadius}
        pathOptions={{
          color: statusColor,
          fillColor: statusColor,
          fillOpacity: 0.08,
          weight: 2,
          dashArray: '6 4',
        }}
      />

      {/* Route polyline - road-snapped when available, otherwise straight line.
          Dashed style indicates a non-snapped fallback so it's visually clear. */}
      <Polyline
        positions={polylinePoints}
        pathOptions={{
          color: statusColor,
          weight: 4,
          opacity: 0.85,
          dashArray: isSnapped ? undefined : '8 6',
        }}
      />

      {/* Start marker */}
      <Marker position={[startPoint.lat, startPoint.lng]}>
        <Popup>
          <strong>Start:</strong> {startPoint.label || 'Route Start'}
        </Popup>
      </Marker>

      {/* End marker */}
      <Marker position={[endPoint.lat, endPoint.lng]}>
        <Popup>
          <strong>End:</strong> {endPoint.label || 'Route End'}
        </Popup>
      </Marker>

      {/* Worker position */}
      {workerPosition && (
        <Circle
          center={[workerPosition.lat, workerPosition.lng]}
          radius={8}
          pathOptions={{
            color: '#2563eb',
            fillColor: '#2563eb',
            fillOpacity: 1,
            weight: 3,
          }}
        />
      )}
    </MapContainer>
  );
}
