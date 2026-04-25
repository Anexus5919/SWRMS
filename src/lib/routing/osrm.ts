/**
 * OSRM (Open Source Routing Machine) client.
 *
 * Snaps a sequence of GPS points to the road network and returns:
 *  - encoded polyline (Google polyline algorithm, precision 5)
 *  - decoded polyline (array of [lat, lng] pairs) for direct rendering
 *  - total distance in meters
 *  - estimated driving duration in seconds
 *
 * Uses the public demo endpoint by default (rate-limited, fine for admin
 * route creation). For production / govt deployment, point OSRM_BASE_URL
 * at a self-hosted instance with India OSM data.
 *
 * Self-hosting reference:
 *   https://github.com/Project-OSRM/osrm-backend
 */

const DEFAULT_OSRM_BASE = 'https://router.project-osrm.org';

export interface OSRMPoint {
  lat: number;
  lng: number;
}

export interface SnappedRoute {
  encodedPolyline: string;
  coordinates: Array<[number, number]>; // [lat, lng]
  distanceMeters: number;
  durationSeconds: number;
  source: 'osrm';
}

export class OSRMError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'OSRMError';
  }
}

function getBaseUrl(): string {
  return process.env.OSRM_BASE_URL?.replace(/\/$/, '') || DEFAULT_OSRM_BASE;
}

/**
 * Decode a Google-encoded polyline string into an array of [lat, lng] pairs.
 * Reference: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(encoded: string, precision = 5): Array<[number, number]> {
  const factor = Math.pow(10, precision);
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: Array<[number, number]> = [];

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
}

/**
 * Call OSRM's /route service. Returns an encoded polyline at precision 5
 * (the OSRM default and the format expected by leaflet polyline decoders).
 *
 * @param points  At least two GPS points: [start, ...waypoints, end]
 * @param signal  Optional AbortSignal so the caller can cancel slow requests
 */
export async function snapToRoads(
  points: OSRMPoint[],
  signal?: AbortSignal,
): Promise<SnappedRoute> {
  if (points.length < 2) {
    throw new OSRMError('At least two points required', 'TOO_FEW_POINTS');
  }

  // OSRM coordinate order is lng,lat (not lat,lng)
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(';');
  const url =
    `${getBaseUrl()}/route/v1/driving/${coords}` +
    `?overview=full&geometries=polyline&steps=false&alternatives=false`;

  let res: Response;
  try {
    res = await fetch(url, {
      // Default timeout ~10s via AbortController for callers that don't pass one
      signal,
      // Don't share cookies / etc with the public demo
      cache: 'no-store',
      headers: { 'User-Agent': 'SWRMS/0.1 (govt prototype)' },
    });
  } catch (err) {
    throw new OSRMError(
      `OSRM request failed: ${(err as Error).message}`,
      'NETWORK_ERROR',
    );
  }

  if (!res.ok) {
    throw new OSRMError(
      `OSRM returned ${res.status} ${res.statusText}`,
      'HTTP_ERROR',
    );
  }

  const data = (await res.json()) as {
    code?: string;
    message?: string;
    routes?: Array<{ geometry: string; distance: number; duration: number }>;
  };

  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new OSRMError(
      data.message ?? `OSRM error: ${data.code ?? 'UNKNOWN'}`,
      data.code ?? 'NO_ROUTE',
    );
  }

  const route = data.routes[0];
  return {
    encodedPolyline: route.geometry,
    coordinates: decodePolyline(route.geometry),
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    source: 'osrm',
  };
}

/**
 * Convenience: snap and return a partial Route document patch
 * (the four routePolyline* fields plus updated timestamp).
 */
export async function snapRouteForPersistence(
  start: OSRMPoint,
  end: OSRMPoint,
  waypoints: OSRMPoint[] = [],
  signal?: AbortSignal,
) {
  const snapped = await snapToRoads([start, ...waypoints, end], signal);
  return {
    routePolyline: snapped.encodedPolyline,
    routePolylineSource: 'osrm' as const,
    routeDistanceKm: Math.round((snapped.distanceMeters / 1000) * 100) / 100,
    routeDurationMinutes: Math.round((snapped.durationSeconds / 60) * 10) / 10,
    routePolylineUpdatedAt: new Date(),
  };
}
