import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Attendance, RouteProgress, Reallocation, VerificationLog, GeoPhoto, Route, User } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { todayIST } from '@/lib/utils/timezone';

/**
 * GET /api/reports - Aggregated reports for admin/supervisor
 */
export async function GET(req: NextRequest) {
  const { error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type') || 'daily_summary';
    const date = searchParams.get('date') || todayIST();
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    switch (reportType) {
      case 'daily_summary':
        return await getDailySummary(date);
      case 'attendance_trend':
        return await getAttendanceTrend(startDate || date, endDate || date);
      case 'route_performance':
        return await getRoutePerformance(date);
      case 'verification_summary':
        return await getVerificationSummary(date);
      default:
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_TYPE', message: 'Invalid report type' } },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error('Report error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to generate report' } },
      { status: 500 }
    );
  }
}

async function getDailySummary(date: string) {
  const [
    totalStaff,
    attendanceRecords,
    routeProgressRecords,
    reallocations,
    verificationLogs,
    geoPhotos,
  ] = await Promise.all([
    User.countDocuments({ role: 'staff', isActive: true }),
    Attendance.find({ date }).lean(),
    RouteProgress.find({ date }).lean(),
    Reallocation.countDocuments({ date }),
    VerificationLog.find({ date }).lean(),
    GeoPhoto.countDocuments({ date }),
  ]);

  const verified = attendanceRecords.filter(a => a.status === 'verified').length;
  const rejected = attendanceRecords.filter(a => a.status === 'rejected').length;
  const completed = routeProgressRecords.filter(r => r.status === 'completed').length;
  const inProgress = routeProgressRecords.filter(r => r.status === 'in_progress').length;
  const stalled = routeProgressRecords.filter(r => r.status === 'stalled').length;
  const criticalLogs = verificationLogs.filter(l => l.severity === 'critical').length;
  const openLogs = verificationLogs.filter(l => l.resolution.status === 'open').length;

  return NextResponse.json({
    success: true,
    data: {
      date,
      attendance: {
        totalStaff,
        present: verified,
        absent: totalStaff - verified,
        rejected,
        attendanceRate: totalStaff > 0 ? Math.round((verified / totalStaff) * 100) : 0,
      },
      routes: {
        total: routeProgressRecords.length,
        completed,
        inProgress,
        stalled,
        notStarted: routeProgressRecords.filter(r => r.status === 'not_started').length,
        completionRate: routeProgressRecords.length > 0
          ? Math.round((completed / routeProgressRecords.length) * 100) : 0,
      },
      reallocations,
      verification: {
        totalLogs: verificationLogs.length,
        critical: criticalLogs,
        open: openLogs,
        geoPhotos,
      },
    },
  });
}

async function getAttendanceTrend(startDate: string, endDate: string) {
  const trend = await Attendance.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        status: 'verified',
      },
    },
    {
      $group: {
        _id: '$date',
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const totalStaff = await User.countDocuments({ role: 'staff', isActive: true });

  return NextResponse.json({
    success: true,
    data: {
      trend: trend.map(t => ({
        date: t._id,
        present: t.count,
        total: totalStaff,
        rate: Math.round((t.count / totalStaff) * 100),
      })),
      totalStaff,
    },
  });
}

async function getRoutePerformance(date: string) {
  const routes = await Route.find({ status: 'active' }).lean();
  const progress = await RouteProgress.find({ date }).lean();
  const attendance = await Attendance.find({ date, status: 'verified' }).lean();

  const routeData = routes.map(route => {
    const rp = progress.find(p => p.routeId.toString() === route._id.toString());
    const presentStaff = attendance.filter(a => a.routeId.toString() === route._id.toString()).length;

    return {
      routeId: route._id,
      name: route.name,
      code: route.code,
      requiredStaff: route.requiredStaff,
      presentStaff,
      staffingRatio: route.requiredStaff > 0 ? Math.round((presentStaff / route.requiredStaff) * 100) / 100 : 0,
      status: rp?.status || 'not_started',
      completionPercentage: rp?.completionPercentage || 0,
    };
  });

  return NextResponse.json({ success: true, data: routeData });
}

async function getVerificationSummary(date: string) {
  const [logs, photoStats] = await Promise.all([
    VerificationLog.aggregate([
      { $match: { date } },
      {
        $group: {
          _id: { type: '$type', severity: '$severity' },
          count: { $sum: 1 },
        },
      },
    ]),
    GeoPhoto.aggregate([
      { $match: { date } },
      {
        $group: {
          _id: { confidence: '$verificationResult.confidence', reviewStatus: '$manualReview.status' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  return NextResponse.json({
    success: true,
    data: { logBreakdown: logs, photoBreakdown: photoStats, date },
  });
}
