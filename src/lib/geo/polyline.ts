/**
 * Geometry helpers for live-tracking deviation detection.
 *
 * Computes the perpendicular distance from a GPS point to the closest
 * segment of a polyline (the road-snapped path returned by OSRM).
 *
 * Implementation notes:
 *  - Distances are in METRES.
 *  - We use an equirectangular projection around the polyline's mean
 *    latitude before doing the segment math. At Mumbai's latitude (~19°)
 *    over a few hundred metres of error this is sub-metre accurate, far
 *    better than naive degree-distance and far cheaper than Haversine
 *    per-segment.
 *  - Earth radius constant is duplicated locally (not imported) so this
 *    helper has no dependency on the rest of the geofence module.
 */

const EARTH_RADIUS_METRES = 6_371_000;
const DEG_TO_RAD = Math.PI / 180;

interface Projected {
  x: number; // metres east of origin
  y: number; // metres north of origin
}

/** Project a (lat, lng) to local metres using equirectangular projection. */
function project(lat: number, lng: number, lat0: number): Projected {
  return {
    x: (lng - 0) * DEG_TO_RAD * EARTH_RADIUS_METRES * Math.cos(lat0 * DEG_TO_RAD),
    y: lat * DEG_TO_RAD * EARTH_RADIUS_METRES,
  };
}

/** Squared distance from point P to segment AB. All inputs in metres. */
function pointToSegmentDistanceSquared(p: Projected, a: Projected, b: Projected): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const ex = p.x - a.x;
    const ey = p.y - a.y;
    return ex * ex + ey * ey;
  }
  // Project P onto the line AB, clamped to [0, 1]
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const cx = a.x + t * dx;
  const cy = a.y + t * dy;
  const ex = p.x - cx;
  const ey = p.y - cy;
  return ex * ex + ey * ey;
}

/**
 * Perpendicular distance (in metres) from a point to a polyline.
 * Polyline is given as an array of [lat, lng] pairs (decoded OSRM output).
 *
 * Returns Infinity for an empty / single-point polyline since "off route"
 * isn't well-defined without geometry.
 */
export function distanceFromPointToPolyline(
  pointLat: number,
  pointLng: number,
  polyline: Array<[number, number]>,
): number {
  if (polyline.length < 2) return Infinity;

  // Use the first vertex's latitude as projection reference. Routes inside
  // a single ward span <5km so the lat0 error is irrelevant.
  const lat0 = polyline[0][0];
  const p = project(pointLat, pointLng, lat0);

  let minSq = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const a = project(polyline[i][0], polyline[i][1], lat0);
    const b = project(polyline[i + 1][0], polyline[i + 1][1], lat0);
    const dSq = pointToSegmentDistanceSquared(p, a, b);
    if (dSq < minSq) minSq = dSq;
  }

  return Math.sqrt(minSq);
}

/**
 * Bounding-box pre-filter. A point further than `radius` metres from the
 * polyline's bounding box can't possibly be within `radius` of any segment.
 * Fast O(1) reject before the per-segment O(N) walk above.
 *
 * Used by the dashboard live-tracker to cheaply ignore pings that are
 * obviously on-route without paying for full distance computation.
 */
export function isPointPossiblyNearPolyline(
  pointLat: number,
  pointLng: number,
  polyline: Array<[number, number]>,
  radiusMetres: number,
): boolean {
  if (polyline.length === 0) return false;

  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;
  for (const [la, ln] of polyline) {
    if (la < minLat) minLat = la;
    if (la > maxLat) maxLat = la;
    if (ln < minLng) minLng = ln;
    if (ln > maxLng) maxLng = ln;
  }

  // Convert radius to degrees (rough approx; lng degrees shrink with cos(lat)).
  const latPad = radiusMetres / 111_000; // 1° lat ≈ 111km
  const lngPad = radiusMetres / (111_000 * Math.cos(((minLat + maxLat) / 2) * DEG_TO_RAD));

  return (
    pointLat >= minLat - latPad &&
    pointLat <= maxLat + latPad &&
    pointLng >= minLng - lngPad &&
    pointLng <= maxLng + lngPad
  );
}

/**
 * Bounding box of a sequence of GPS points, used for idle detection.
 * Returns the rectangle's diagonal length in metres — if a worker has
 * moved less than `idleThreshold` metres across N pings, they're idle.
 */
export function pointsSpanMetres(points: Array<{ lat: number; lng: number }>): number {
  if (points.length < 2) return 0;
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  const lat0 = (minLat + maxLat) / 2;
  const dLat = (maxLat - minLat) * DEG_TO_RAD * EARTH_RADIUS_METRES;
  const dLng =
    (maxLng - minLng) * DEG_TO_RAD * EARTH_RADIUS_METRES * Math.cos(lat0 * DEG_TO_RAD);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}
