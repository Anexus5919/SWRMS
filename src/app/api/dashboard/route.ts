import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Route, Attendance, RouteProgress, User } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { STAFFING_THRESHOLDS } from '@/lib/utils/constants';

function todayString() {
  return new Date().toISOString().split('T')[0];
}

function getStatusLabel(ratio: number) {
  if (ratio >= STAFFING_THRESHOLDS.ADEQUATE) return 'adequate';
  if (ratio >= STAFFING_THRESHOLDS.CRITICAL) return 'marginal';
  return 'critical';
}

/**
 * GET /api/dashboard — Aggregated dashboard data for supervisor
 */
export async function GET() {
  const { error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  await connectDB();
  const today = todayString();

  // Get all active routes
  const routes = await Route.find({ status: 'active' }).sort({ code: 1 }).lean();

  // Get all verified attendance for today
  const attendanceRecords = await Attendance.find({
    date: today,
    status: 'verified',
  }).lean();

  // Get route progress for today
  const progressRecords = await RouteProgress.find({ date: today }).lean();

  // Build attendance counts per route
  const attendanceByRoute: Record<string, number> = {};
  for (const record of attendanceRecords) {
    const key = record.routeId.toString();
    attendanceByRoute[key] = (attendanceByRoute[key] || 0) + 1;
  }

  // Build progress map
  const progressByRoute: Record<string, typeof progressRecords[0]> = {};
  for (const p of progressRecords) {
    progressByRoute[p.routeId.toString()] = p;
  }

  // Assemble route dashboard data
  const routeData = routes.map((route) => {
    const routeIdStr = route._id.toString();
    const present = attendanceByRoute[routeIdStr] || 0;
    const required = route.requiredStaff;
    const ratio = required > 0 ? present / required : 0;
    const progress = progressByRoute[routeIdStr];

    return {
      _id: route._id,
      name: route.name,
      code: route.code,
      startPoint: route.startPoint,
      endPoint: route.endPoint,
      estimatedLengthKm: route.estimatedLengthKm,
      requiredStaff: required,
      presentStaff: present,
      staffingRatio: Math.round(ratio * 100) / 100,
      statusLabel: getStatusLabel(ratio),
      routeProgress: {
        status: progress?.status || 'not_started',
        completionPercentage: progress?.completionPercentage || 0,
      },
    };
  });

  // Summary stats
  const totalStaffRequired = routes.reduce((sum, r) => sum + r.requiredStaff, 0);
  const totalPresent = attendanceRecords.length;
  const totalRejected = await Attendance.countDocuments({ date: today, status: 'rejected' });
  const criticalRoutes = routeData.filter((r) => r.statusLabel === 'critical').length;
  const completedRoutes = routeData.filter((r) => r.routeProgress.status === 'completed').length;

  return NextResponse.json({
    success: true,
    data: {
      date: today,
      routes: routeData,
      summary: {
        totalRoutes: routes.length,
        totalStaffRequired,
        totalPresent,
        totalRejected,
        criticalRoutes,
        completedRoutes,
        overallAttendanceRate: totalStaffRequired > 0
          ? Math.round((totalPresent / totalStaffRequired) * 100)
          : 0,
      },
    },
  });
}
