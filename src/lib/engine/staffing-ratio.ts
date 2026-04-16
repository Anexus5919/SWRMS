import { connectDB } from '../db/connection';
import { Route, Attendance } from '../db/models';
import { STAFFING_THRESHOLDS } from '../utils/constants';

export interface RouteStaffing {
  routeId: string;
  routeCode: string;
  routeName: string;
  startPoint: { lat: number; lng: number };
  required: number;
  present: number;
  ratio: number;
  status: 'critical' | 'marginal' | 'adequate';
}

/**
 * Computes the staffing ratio for all active routes on a given date.
 */
export async function computeStaffingRatios(date: string): Promise<RouteStaffing[]> {
  await connectDB();

  const routes = await Route.find({ status: 'active' }).lean();
  const attendance = await Attendance.find({ date, status: 'verified' }).lean();

  // Count present by route
  const countByRoute: Record<string, number> = {};
  for (const a of attendance) {
    const key = a.routeId.toString();
    countByRoute[key] = (countByRoute[key] || 0) + 1;
  }

  return routes.map((route) => {
    const routeId = route._id.toString();
    const present = countByRoute[routeId] || 0;
    const ratio = route.requiredStaff > 0 ? present / route.requiredStaff : 0;

    let status: 'critical' | 'marginal' | 'adequate';
    if (ratio < STAFFING_THRESHOLDS.CRITICAL) {
      status = 'critical';
    } else if (ratio < STAFFING_THRESHOLDS.ADEQUATE) {
      status = 'marginal';
    } else {
      status = 'adequate';
    }

    return {
      routeId,
      routeCode: route.code,
      routeName: route.name,
      startPoint: { lat: route.startPoint.lat, lng: route.startPoint.lng },
      required: route.requiredStaff,
      present,
      ratio: Math.round(ratio * 100) / 100,
      status,
    };
  });
}
