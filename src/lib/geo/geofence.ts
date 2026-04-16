import { haversineDistance } from './haversine';
import { GEOFENCE_RADIUS_METERS } from '../utils/constants';

export interface GeofenceResult {
  verified: boolean;
  distance: number; // meters
  message: string;
}

/**
 * Verifies whether a worker's GPS coordinates fall within
 * the geofence radius of the assigned route's starting point.
 */
export function verifyGeofence(
  workerLat: number,
  workerLng: number,
  routeStartLat: number,
  routeStartLng: number,
  radiusMeters: number = GEOFENCE_RADIUS_METERS
): GeofenceResult {
  const distance = haversineDistance(
    workerLat,
    workerLng,
    routeStartLat,
    routeStartLng
  );

  const roundedDistance = Math.round(distance);

  if (distance <= radiusMeters) {
    return {
      verified: true,
      distance: roundedDistance,
      message: `Attendance verified. You are ${roundedDistance}m from the route start.`,
    };
  }

  return {
    verified: false,
    distance: roundedDistance,
    message: `Attendance rejected. Distance ${roundedDistance}m exceeds ${radiusMeters}m geofence radius.`,
  };
}
