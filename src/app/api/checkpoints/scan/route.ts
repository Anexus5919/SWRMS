import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db/connection';
import { Checkpoint, CheckpointScan, RouteProgress, Attendance, User } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { todayIST } from '@/lib/utils/timezone';
import { haversineDistance } from '@/lib/geo/haversine';

const TRUSTED_DISTANCE_METRES = 50;

const scanSchema = z.object({
  code: z.string().min(1).max(200),
  method: z.enum(['nfc', 'qr']),
  coordinates: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      accuracy: z.number().min(0).max(10_000).optional(),
    })
    .optional(),
});

/**
 * POST /api/checkpoints/scan - Worker scanned an NFC tag or QR sticker.
 *
 * Workflow:
 *   1. Worker taps phone to NFC sticker (or scans QR via PWA camera).
 *   2. Client POSTs the encoded `code` value here with their current GPS.
 *   3. Server resolves the Checkpoint, verifies it belongs to the worker's
 *      assigned route, computes distance from scan position to the
 *      sticker's known coords, and stores a CheckpointScan.
 *   4. Updates RouteProgress.completionPercentage based on the worker's
 *      latest scan order vs total checkpoints on the route.
 *
 * Designed to be deterministic: if 7 of 10 stickers along the route have
 * been scanned in order, completionPercentage = 70%. This sidesteps the
 * GPS-jitter problem the project report calls out for narrow Mumbai lanes.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('staff');
  if (error) return error;

  const userId = session?.user?.id as string;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Body must be valid JSON' } },
      { status: 400 }
    );
  }

  const parsed = scanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid scan payload',
        },
      },
      { status: 400 }
    );
  }

  await connectDB();
  const today = todayIST();

  // Resolve checkpoint
  const checkpoint = await Checkpoint.findOne({
    code: parsed.data.code,
    isActive: true,
  }).lean();
  if (!checkpoint) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CHECKPOINT_UNKNOWN',
          message: 'This checkpoint code is not recognized.',
        },
      },
      { status: 404 }
    );
  }

  // Worker must have verified attendance and the checkpoint must be on
  // their assigned route.
  const [user, attendance] = await Promise.all([
    User.findById(userId).select('assignedRouteId').lean(),
    Attendance.findOne({ userId, date: today, status: 'verified' }).select('_id').lean(),
  ]);

  if (!attendance) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'NOT_ON_SHIFT', message: 'Mark attendance before scanning checkpoints.' },
      },
      { status: 412 }
    );
  }

  if (!user?.assignedRouteId || user.assignedRouteId.toString() !== checkpoint.routeId.toString()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'WRONG_ROUTE',
          message: 'This checkpoint is not on your assigned route.',
        },
      },
      { status: 403 }
    );
  }

  // Compute distance from scan position to the known sticker location.
  let distance: number | null = null;
  let trusted = parsed.data.method === 'nfc';
  // NFC requires <4cm physical proximity, so we automatically trust it.
  // QR can be scanned from far away (or from a photo of the sticker), so
  // we require GPS to be within TRUSTED_DISTANCE_METRES of the sticker.
  if (parsed.data.coordinates) {
    distance = Math.round(
      haversineDistance(
        parsed.data.coordinates.lat,
        parsed.data.coordinates.lng,
        checkpoint.coordinates.lat,
        checkpoint.coordinates.lng
      )
    );
    if (parsed.data.method === 'qr') {
      trusted = distance <= TRUSTED_DISTANCE_METRES;
    }
  } else if (parsed.data.method === 'qr') {
    // QR scan with no GPS fix - cannot trust
    trusted = false;
  }

  let scan;
  try {
    scan = await CheckpointScan.create({
      checkpointId: checkpoint._id,
      routeId: checkpoint.routeId,
      workerId: userId,
      date: today,
      scannedAt: new Date(),
      method: parsed.data.method,
      coordinates: parsed.data.coordinates ?? null,
      distanceFromCheckpointMeters: distance,
      trusted,
    });
  } catch (err) {
    // Duplicate (worker already scanned this checkpoint today)
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_SCANNED',
            message: 'You have already scanned this checkpoint today.',
          },
        },
        { status: 409 }
      );
    }
    throw err;
  }

  // Recompute progress: trusted scans count toward completion.
  const [totalCheckpoints, trustedScansForWorker] = await Promise.all([
    Checkpoint.countDocuments({ routeId: checkpoint.routeId, isActive: true }),
    CheckpointScan.countDocuments({
      routeId: checkpoint.routeId,
      workerId: userId,
      date: today,
      trusted: true,
    }),
  ]);

  const percentage =
    totalCheckpoints > 0
      ? Math.min(100, Math.round((trustedScansForWorker / totalCheckpoints) * 100))
      : 0;

  await RouteProgress.updateOne(
    { routeId: checkpoint.routeId, date: today },
    {
      $set: {
        completionPercentage: percentage,
        status: percentage >= 100 ? 'completed' : percentage > 0 ? 'in_progress' : 'not_started',
      },
      $push: {
        updates: {
          time: new Date(),
          percentage,
          updatedBy: userId,
          note: `Checkpoint ${checkpoint.label} scanned via ${parsed.data.method}${trusted ? '' : ' (untrusted)'}`,
        },
      },
    },
    { upsert: true }
  );

  return NextResponse.json({
    success: true,
    data: {
      scanId: scan._id.toString(),
      checkpoint: { id: checkpoint._id.toString(), label: checkpoint.label, order: checkpoint.order },
      method: parsed.data.method,
      trusted,
      distanceFromCheckpointMeters: distance,
      progress: {
        scanned: trustedScansForWorker,
        total: totalCheckpoints,
        percentage,
      },
    },
  });
}
