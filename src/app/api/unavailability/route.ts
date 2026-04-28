import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db/connection';
import { Attendance, Unavailability, User } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { todayIST } from '@/lib/utils/timezone';
import { logAudit } from '@/lib/audit';
import { checkLimit, rateLimitResponse, LIMITS } from '@/lib/rate-limit';
import { notifyAboutWorker } from '@/lib/push';

const declareUnavailabilitySchema = z.object({
  reason: z.enum(['sick', 'personal', 'transport', 'other']),
  notes: z.string().max(500).optional(),
});

/**
 * POST /api/unavailability - Worker declares they're unable to work today.
 *
 * Must be called BEFORE attendance is marked. Once declared, the worker
 * cannot then check in for the same date (and the engine will treat them
 * as absent for staffing-ratio purposes).
 *
 * Designed to be a single big-button action for low-literacy users -
 * the staff home page renders four icon buttons (sick, personal, transport,
 * other) and one tap sends the request.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('staff');
  if (error) return error;

  const userId = session?.user?.id as string;

  const limit = checkLimit(`unavail:${userId}`, LIMITS.unavailability.max, LIMITS.unavailability.windowMs);
  if (!limit.ok) return rateLimitResponse(limit);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Body must be valid JSON' } },
      { status: 400 }
    );
  }

  const parsed = declareUnavailabilitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid unavailability payload',
        },
      },
      { status: 400 }
    );
  }

  await connectDB();
  const today = todayIST();

  // Block if already checked in - can't retro-actively claim sick
  const existingAttendance = await Attendance.findOne({ userId, date: today })
    .select('_id')
    .lean();
  if (existingAttendance) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ALREADY_CHECKED_IN',
          message: 'You have already marked attendance today and cannot now mark yourself unavailable.',
        },
      },
      { status: 409 }
    );
  }

  // Block if already declared
  const existing = await Unavailability.findOne({ userId, date: today }).select('_id').lean();
  if (existing) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ALREADY_DECLARED',
          message: 'You have already declared yourself unavailable for today.',
        },
      },
      { status: 409 }
    );
  }

  const user = await User.findById(userId).select('assignedRouteId employeeId name').lean();

  const record = await Unavailability.create({
    userId,
    date: today,
    reason: parsed.data.reason,
    notes: parsed.data.notes ?? null,
    routeId: user?.assignedRouteId ?? null,
    declaredAt: new Date(),
  });

  await logAudit({
    action: 'user.updated',
    category: 'user',
    actorId: userId,
    actorEmployeeId: user?.employeeId,
    actorRole: 'staff',
    targetType: 'unavailability',
    targetId: record._id.toString(),
    targetLabel: `${user?.employeeId ?? userId} unavailable (${parsed.data.reason})`,
    metadata: { reason: parsed.data.reason, notes: parsed.data.notes ?? null, date: today },
    req,
  });

  // Push + inbox: this is high-priority for supervisors because the route
  // they planned for today now has a staffing gap they may need to fill
  // via reallocation. Per-worker tag so a worker can't spam by re-submitting.
  const reasonLabels: Record<typeof parsed.data.reason, string> = {
    sick: 'sick leave',
    personal: 'personal leave',
    transport: 'no transport',
    other: 'other reason',
  };
  await notifyAboutWorker({
    workerId: userId,
    routeId: user?.assignedRouteId ?? null,
    kind: 'unavailability_declared',
    tag: `unavail-${userId}-${today}`,
    url: '/reallocation',
    template: (name, code) => ({
      title: `${name} unavailable today (${code})`,
      body: `Reason: ${reasonLabels[parsed.data.reason]}${
        parsed.data.notes ? ` · ${parsed.data.notes.slice(0, 80)}` : ''
      }. Consider reallocation.`,
    }),
    contextExtras: {
      date: today,
      reason: parsed.data.reason,
      notes: parsed.data.notes ?? null,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      id: record._id.toString(),
      reason: record.reason,
      declaredAt: record.declaredAt,
    },
  });
}

/**
 * GET /api/unavailability - Supervisor view of today's unavailability declarations.
 */
export async function GET(req: NextRequest) {
  const { error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || todayIST();

  const records = await Unavailability.find({ date })
    .populate('userId', 'employeeId name')
    .populate('routeId', 'code name')
    .sort({ declaredAt: -1 })
    .lean();

  return NextResponse.json({ success: true, data: records });
}
