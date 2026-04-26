import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { User, Attendance, GeoPhoto, RouteProgress, Route, Unavailability } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { todayIST } from '@/lib/utils/timezone';

/**
 * GET /api/staff/status - Daily status checklist for the authenticated staff member
 */
export async function GET() {
  const { session, error } = await requireRole('staff');
  if (error) return error;

  await connectDB();

  const userId = session!.user.id;
  const today = todayIST();

  // Run all queries in parallel
  const [user, attendance, shiftStartPhoto, checkpointCount, shiftEndPhoto, unavailability] =
    await Promise.all([
      User.findById(userId).select('faceDescriptor assignedRouteId name').lean(),
      Attendance.findOne({ userId, date: today, status: 'verified' }).lean(),
      GeoPhoto.findOne({ userId, date: today, type: 'shift_start' }).lean(),
      GeoPhoto.countDocuments({ userId, date: today, type: 'checkpoint' }),
      GeoPhoto.findOne({ userId, date: today, type: 'shift_end' }).lean(),
      Unavailability.findOne({ userId, date: today }).select('reason declaredAt').lean(),
    ]);

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
      { status: 404 }
    );
  }

  // Get route info and progress if user has an assigned route
  let routeProgress = null;
  let route = null;

  if (user.assignedRouteId) {
    [routeProgress, route] = await Promise.all([
      RouteProgress.findOne({ routeId: user.assignedRouteId, date: today }).lean(),
      Route.findById(user.assignedRouteId).select('name code shiftEnd shiftStart').lean(),
    ]);
  }

  // Format time helper
  const formatTime = (date: Date | undefined | null): string | null => {
    if (!date) return null;
    const d = new Date(date);
    const hours = d.getUTCHours() + 5 + (d.getUTCMinutes() + 30 >= 60 ? 1 : 0);
    const minutes = (d.getUTCMinutes() + 30) % 60;
    return `${String(hours % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  // Demo bypass (see src/app/(staff)/layout.tsx). When the flag is set we
  // report face as registered so the home-page checklist doesn't block
  // every demo user on step 1.
  const bypassFace = process.env.NEXT_PUBLIC_DEMO_BYPASS_FACE === '1';

  const data = {
    faceRegistered: bypassFace || !!(user.faceDescriptor && user.faceDescriptor.length > 0),
    attendance: {
      marked: !!attendance,
      time: attendance ? formatTime(attendance.checkInTime) : null,
      status: attendance ? attendance.status : null,
    },
    photos: {
      shiftStart: {
        submitted: !!shiftStartPhoto,
        verified: shiftStartPhoto ? shiftStartPhoto.verificationResult?.verified ?? false : false,
        time: shiftStartPhoto ? formatTime(shiftStartPhoto.createdAt) : null,
      },
      checkpoints: checkpointCount,
      shiftEnd: {
        submitted: !!shiftEndPhoto,
        verified: shiftEndPhoto ? shiftEndPhoto.verificationResult?.verified ?? false : false,
        time: shiftEndPhoto ? formatTime(shiftEndPhoto.createdAt) : null,
      },
    },
    routeProgress: routeProgress
      ? {
          percentage: routeProgress.completionPercentage,
          status: routeProgress.status,
        }
      : { percentage: 0, status: 'not_started' },
    route: route
      ? { name: route.name, code: route.code, shiftStart: route.shiftStart, shiftEnd: route.shiftEnd }
      : null,
    unavailability: unavailability
      ? { reason: unavailability.reason, declaredAt: unavailability.declaredAt }
      : null,
  };

  return NextResponse.json({ success: true, data });
}
