import { connectDB } from '../db/connection';
import { User, Attendance, RouteProgress } from '../db/models';
import { computeStaffingRatios, RouteStaffing } from './staffing-ratio';
import { haversineDistance } from '../geo/haversine';

export interface ReallocationSuggestion {
  worker: {
    id: string;
    employeeId: string;
    name: string;
  };
  fromRoute: {
    id: string;
    code: string;
    name: string;
  };
  toRoute: {
    id: string;
    code: string;
    name: string;
  };
  distanceKm: number;
  impactScore: number;
  fromRatio: number;
  toRatio: number;
}

/**
 * Core reallocation engine.
 * Finds surplus workers on completed/overstaffed routes and suggests
 * reassignment to critically understaffed routes, sorted by proximity.
 */
export async function generateReallocationSuggestions(
  date: string
): Promise<ReallocationSuggestion[]> {
  await connectDB();

  const ratios = await computeStaffingRatios(date);

  // Identify critical routes (need workers)
  const criticalRoutes = ratios
    .filter((r) => r.status === 'critical')
    .sort((a, b) => a.ratio - b.ratio); // Most critical first

  if (criticalRoutes.length === 0) return [];

  // Identify surplus routes (have extra workers AND route is completed or overstaffed)
  const surplusRoutes = ratios.filter((r) => r.ratio > 1.0);

  // Get progress to check which routes are completed
  const progressRecords = await RouteProgress.find({ date }).lean();
  const completedRouteIds = new Set(
    progressRecords
      .filter((p) => p.status === 'completed')
      .map((p) => p.routeId.toString())
  );

  // Prefer completed routes for surplus, but also include overstaffed active routes
  const prioritizedSurplus = surplusRoutes.sort((a, b) => {
    const aCompleted = completedRouteIds.has(a.routeId) ? 0 : 1;
    const bCompleted = completedRouteIds.has(b.routeId) ? 0 : 1;
    return aCompleted - bCompleted || b.ratio - a.ratio;
  });

  // Collect surplus workers
  const surplusWorkers: {
    worker: { id: string; employeeId: string; name: string };
    fromRoute: RouteStaffing;
  }[] = [];

  for (const sRoute of prioritizedSurplus) {
    const excessCount = sRoute.present - sRoute.required;
    if (excessCount <= 0) continue;

    // Get workers who checked in on this route today
    const checkedIn = await Attendance.find({
      routeId: sRoute.routeId,
      date,
      status: 'verified',
    })
      .populate('userId', 'employeeId name')
      .lean();

    // Take only excess workers
    const excessWorkers = checkedIn.slice(0, excessCount);
    for (const a of excessWorkers) {
      const u = a.userId as any;
      if (u) {
        surplusWorkers.push({
          worker: {
            id: u._id.toString(),
            employeeId: u.employeeId,
            name: `${u.name.first} ${u.name.last}`,
          },
          fromRoute: sRoute,
        });
      }
    }
  }

  if (surplusWorkers.length === 0) return [];

  // Generate suggestions
  const suggestions: ReallocationSuggestion[] = [];
  const assignedWorkers = new Set<string>();

  for (const critRoute of criticalRoutes) {
    const needed = critRoute.required - critRoute.present;

    // Sort surplus workers by distance to this critical route
    const candidatesWithDistance = surplusWorkers
      .filter((sw) => !assignedWorkers.has(sw.worker.id))
      .map((sw) => ({
        ...sw,
        distanceKm:
          haversineDistance(
            sw.fromRoute.startPoint.lat,
            sw.fromRoute.startPoint.lng,
            critRoute.startPoint.lat,
            critRoute.startPoint.lng
          ) / 1000,
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    let assigned = 0;
    for (const candidate of candidatesWithDistance) {
      if (assigned >= needed) break;

      suggestions.push({
        worker: candidate.worker,
        fromRoute: {
          id: candidate.fromRoute.routeId,
          code: candidate.fromRoute.routeCode,
          name: candidate.fromRoute.routeName,
        },
        toRoute: {
          id: critRoute.routeId,
          code: critRoute.routeCode,
          name: critRoute.routeName,
        },
        distanceKm: Math.round(candidate.distanceKm * 10) / 10,
        impactScore:
          Math.round(((1 / (critRoute.ratio || 0.1)) * (1 / (candidate.distanceKm || 0.1))) * 100) / 100,
        fromRatio: candidate.fromRoute.ratio,
        toRatio: critRoute.ratio,
      });

      assignedWorkers.add(candidate.worker.id);
      assigned++;
    }
  }

  // Sort by impact score descending
  suggestions.sort((a, b) => b.impactScore - a.impactScore);

  return suggestions;
}
