import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Attendance, Route, Unavailability, User } from '@/lib/db/models';
import { recordAndPush } from '@/lib/push';
import { todayIST } from '@/lib/utils/timezone';

/**
 * POST /api/cron/missed-shift-alert
 *
 * Detect workers who have *missed their shift today* and push a single
 * summary notification to all subscribed supervisors of the same ward.
 *
 * "Missed" means: assigned to an active route, the route's `shiftStart`
 * was at least `GRACE_MINUTES` ago in IST, and there is no Attendance
 * row AND no Unavailability declaration for today.
 *
 * Auth: protected by a shared CRON_SECRET. Set the same value in your
 * scheduler (Vercel Cron, GitHub Actions, plain crontab + curl, etc.):
 *
 *   curl -X POST https://.../api/cron/missed-shift-alert \
 *        -H "x-cron-secret: $CRON_SECRET"
 *
 * Idempotent within reason — repeated calls within a few minutes will
 * re-detect the same workers; the `tag` on the push lets the OS replace
 * the prior notification rather than stacking duplicates.
 */

const GRACE_MINUTES = 30;

function authorise(req: NextRequest): NextResponse | null {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CRON_NOT_CONFIGURED',
          message:
            'CRON_SECRET is not set. This endpoint refuses to run without an auth secret.',
        },
      },
      { status: 503 }
    );
  }
  const got = req.headers.get('x-cron-secret');
  if (got !== expected) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    );
  }
  return null;
}

/** Convert "HH:MM" IST to UTC ms-since-epoch for `today`. */
function shiftStartUTC(today: string, shiftStart: string): number {
  const [h, m] = shiftStart.split(':').map(Number);
  const istMs = new Date(`${today}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`).getTime();
  // Subtract IST offset to get UTC instant.
  return istMs - 5.5 * 60 * 60 * 1000;
}

export async function POST(req: NextRequest) {
  const authError = authorise(req);
  if (authError) return authError;

  await connectDB();

  const today = todayIST();
  const now = Date.now();
  const grace = GRACE_MINUTES * 60_000;

  // Dev-only escape hatch: ?force=1 skips the shift-lapse check so
  // operators can test the push pipeline at any time of day. Still
  // gated by CRON_SECRET, so no security implication — just bypasses
  // the "wait until 06:30 IST" guard during a manual smoke test.
  const { searchParams } = new URL(req.url);
  const force = searchParams.get('force') === '1';

  const [routes, attendance, unavailability, staff] = await Promise.all([
    Route.find({ status: 'active' }).select('_id ward shiftStart code name requiredStaff').lean(),
    Attendance.find({ date: today }).select('userId').lean(),
    Unavailability.find({ date: today }).select('userId').lean(),
    User.find({ role: 'staff', isActive: true })
      .select('_id name ward assignedRouteId')
      .lean(),
  ]);

  const attendedSet = new Set(attendance.map((a) => a.userId.toString()));
  const unavailableSet = new Set(unavailability.map((u) => u.userId.toString()));
  const routeById = new Map(routes.map((r) => [r._id.toString(), r]));

  // Group missed workers by ward so each supervisor gets a focused alert.
  const missedByWard = new Map<
    string,
    { count: number; workers: string[]; routeCodes: Set<string> }
  >();

  for (const worker of staff) {
    if (!worker.assignedRouteId) continue;
    const route = routeById.get(worker.assignedRouteId.toString());
    if (!route) continue;
    if (!force && now - shiftStartUTC(today, route.shiftStart) < grace) continue; // shift hasn't lapsed

    const id = worker._id.toString();
    if (attendedSet.has(id) || unavailableSet.has(id)) continue;

    const ward = worker.ward || route.ward || 'Unassigned';
    const bucket = missedByWard.get(ward) ?? {
      count: 0,
      workers: [],
      routeCodes: new Set<string>(),
    };
    bucket.count += 1;
    if (bucket.workers.length < 3) {
      bucket.workers.push(`${worker.name.first} ${worker.name.last}`.trim());
    }
    bucket.routeCodes.add(route.code);
    missedByWard.set(ward, bucket);
  }

  if (missedByWard.size === 0) {
    return NextResponse.json({
      success: true,
      data: { date: today, missedTotal: 0, wardsAlerted: 0, sent: 0 },
    });
  }

  // For every ward bucket, record one notification PER recipient
  // (admins + supervisors) and try to deliver via push. The inbox is
  // populated even when push fails or no subscription exists.
  const results = await Promise.all(
    Array.from(missedByWard.entries()).map(async ([ward, bucket]) => {
      const preview = bucket.workers.join(', ') + (bucket.count > bucket.workers.length ? '…' : '');
      return recordAndPush({
        recipientsQuery: { $or: [{ role: 'admin' }, { role: 'supervisor' }] },
        kind: 'missed_shift',
        title: `${bucket.count} worker${bucket.count > 1 ? 's' : ''} missing in ${ward}`,
        body:
          `${preview} have not checked in. ` +
          `Routes: ${Array.from(bucket.routeCodes).slice(0, 4).join(', ')}.`,
        tag: `missed-shift-${ward}-${today}`,
        url: '/attendance-log',
        context: {
          ward,
          missedCount: bucket.count,
          previewWorkers: bucket.workers,
          routeCodes: Array.from(bucket.routeCodes),
          date: today,
        },
      });
    })
  );

  const totals = results.reduce(
    (acc, r) => ({
      sent: acc.sent + r.pushSent,
      revoked: acc.revoked + r.pushRevoked,
      failed: acc.failed + r.pushFailed,
      recipients: acc.recipients + r.recipients,
    }),
    { sent: 0, revoked: 0, failed: 0, recipients: 0 }
  );

  const missedTotal = Array.from(missedByWard.values()).reduce((s, b) => s + b.count, 0);

  return NextResponse.json({
    success: true,
    data: {
      date: today,
      missedTotal,
      wardsAlerted: missedByWard.size,
      ...totals,
    },
  });
}
