import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Attendance, GeoPhoto, VerificationLog, User, Route } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { todayIST } from '@/lib/utils/timezone';
import { notifyAboutWorker } from '@/lib/push';

/**
 * POST /api/photos/missing - Detect workers who marked attendance but didn't submit photos.
 * Creates VerificationLog entries for each missing photo.
 * Called by supervisor or can be triggered by cron.
 */
export async function POST(req: NextRequest) {
  const { error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  try {
    await connectDB();
    const today = todayIST();

    // Find all verified attendance for today
    const verifiedAttendance = await Attendance.find({
      date: today,
      status: 'verified',
    }).lean();

    // Find all shift_start photos submitted today
    const shiftPhotos = await GeoPhoto.find({
      date: today,
      type: 'shift_start',
    }).lean();

    const photoUserIds = new Set(shiftPhotos.map(p => p.userId.toString()));

    // Find workers who have attendance but no shift_start photo
    const missingPhotoWorkers = verifiedAttendance.filter(
      a => !photoUserIds.has(a.userId.toString())
    );

    let created = 0;

    for (const att of missingPhotoWorkers) {
      // Check if we already logged this today
      const existingLog = await VerificationLog.findOne({
        type: 'missing_photo',
        date: today,
        affectedUserId: att.userId,
      });

      if (existingLog) continue;

      const worker = await User.findById(att.userId).select('employeeId name').lean();
      const route = await Route.findById(att.routeId).select('name code').lean();

      if (!worker || !route) continue;

      await VerificationLog.create({
        type: 'missing_photo',
        severity: 'warning',
        routeId: att.routeId,
        date: today,
        affectedUserId: att.userId,
        details: {
          message: `${(worker.name as any).first} ${(worker.name as any).last} (${worker.employeeId}) marked attendance at ${new Date(att.checkInTime).toLocaleTimeString('en-IN')} but has not submitted shift start photo`,
          coordinates: att.coordinates ? { lat: att.coordinates.lat, lng: att.coordinates.lng } : undefined,
        },
        resolution: { status: 'open' },
      });

      // Push + inbox row. The VerificationLog dedupe above (existingLog
      // check) ensures we never fire this twice for the same worker per day.
      await notifyAboutWorker({
        workerId: att.userId,
        routeId: att.routeId,
        kind: 'photo_missing',
        tag: `nophoto-${att.userId}-${today}`,
        url: '/verification',
        template: (name, code) => ({
          title: `${name} missing shift-start photo (${code})`,
          body: `Attendance marked at ${new Date(att.checkInTime).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          })} but no shift-start photo submitted yet.`,
        }),
        contextExtras: {
          checkInTime: new Date(att.checkInTime).toISOString(),
          date: today,
        },
      });

      created++;
    }

    return NextResponse.json({
      success: true,
      data: {
        totalVerifiedAttendance: verifiedAttendance.length,
        totalShiftPhotos: shiftPhotos.length,
        missingPhotos: missingPhotoWorkers.length,
        newLogsCreated: created,
      },
    });
  } catch (err) {
    console.error('Missing photo check error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to check missing photos' } },
      { status: 500 }
    );
  }
}
