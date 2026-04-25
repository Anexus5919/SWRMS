import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db/connection';
import { Reallocation, User, Route } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { createReallocationSchema } from '@/lib/validators/schemas';
import { logAudit } from '@/lib/audit';
import { todayIST } from '@/lib/utils/timezone';

/**
 * POST /api/reallocation - Execute a reallocation (supervisor approves).
 *
 * Wrapped in a Mongoose transaction so we never end up in a half-committed
 * state where the worker is reassigned but no Reallocation record exists
 * (or vice-versa). Replica-set / Atlas required for transactions; if the
 * cluster is standalone (e.g. local dev) we fall back to sequential writes
 * with a defensive rollback path.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('supervisor');
  if (error) return error;

  await connectDB();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = createReallocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const {
    workerId,
    fromRouteId,
    toRouteId,
    distanceBetweenRoutes,
    previousStaffingRatio,
    newStaffingRatio,
  } = parsed.data;

  const reason =
    (parsed.data as { reason?: 'understaffed' | 'route_completed' | 'manual' }).reason ?? 'understaffed';

  const supervisorId = session?.user?.id as string | undefined;
  const supervisorEmployeeId =
    (session?.user as { employeeId?: string } | undefined)?.employeeId;

  const today = todayIST();

  // Try a real transaction first. If the deployment doesn't support it
  // (standalone mongo, dev), fall back to a guarded sequential path.
  const conn = mongoose.connection;
  let reallocationDoc: mongoose.Document | null = null;
  let usedTransaction = false;

  try {
    const session = await conn.startSession();
    try {
      await session.withTransaction(async () => {
        // Verify worker exists and is currently on fromRouteId. Reject otherwise.
        const worker = await User.findById(workerId).session(session).lean();
        if (!worker) {
          throw new Error('WORKER_NOT_FOUND');
        }
        if (
          worker.assignedRouteId &&
          worker.assignedRouteId.toString() !== fromRouteId.toString()
        ) {
          throw new Error('WORKER_NOT_ON_FROM_ROUTE');
        }

        const [, doc] = await Promise.all([
          User.updateOne(
            { _id: workerId },
            { assignedRouteId: toRouteId }
          ).session(session),
          Reallocation.create(
            [
              {
                fromRouteId,
                toRouteId,
                workerId,
                supervisorId,
                date: today,
                reason,
                status: 'approved',
                distanceBetweenRoutes,
                previousStaffingRatio,
                newStaffingRatio,
              },
            ],
            { session }
          ).then((arr) => arr[0]),
        ]);

        reallocationDoc = doc;
      });
      usedTransaction = true;
    } finally {
      await session.endSession();
    }
  } catch (err) {
    const message = (err as Error).message;
    if (message === 'WORKER_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Worker not found' } },
        { status: 404 }
      );
    }
    if (message === 'WORKER_NOT_ON_FROM_ROUTE') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STATE_CONFLICT',
            message: 'Worker is not currently assigned to the source route',
          },
        },
        { status: 409 }
      );
    }
    // Transaction-not-supported is a Mongo "error" we recover from by
    // running the writes sequentially with a manual rollback on failure.
    const isTxnUnsupported =
      message?.includes('Transaction numbers') ||
      message?.includes('replica set') ||
      message?.includes('not supported');

    if (!isTxnUnsupported) {
      console.error('[reallocation] transaction failed:', err);
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Reallocation could not be completed' },
        },
        { status: 500 }
      );
    }

    // Fallback path: do the writes sequentially. If the second write fails,
    // revert the first to keep state consistent.
    const before = await User.findById(workerId).lean();
    if (!before) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Worker not found' } },
        { status: 404 }
      );
    }
    if (
      before.assignedRouteId &&
      before.assignedRouteId.toString() !== fromRouteId.toString()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STATE_CONFLICT',
            message: 'Worker is not currently assigned to the source route',
          },
        },
        { status: 409 }
      );
    }

    await User.updateOne({ _id: workerId }, { assignedRouteId: toRouteId });
    try {
      reallocationDoc = await Reallocation.create({
        fromRouteId,
        toRouteId,
        workerId,
        supervisorId,
        date: today,
        reason,
        status: 'approved',
        distanceBetweenRoutes,
        previousStaffingRatio,
        newStaffingRatio,
      });
    } catch (createErr) {
      // Roll the user assignment back so we don't leave a phantom move.
      await User.updateOne(
        { _id: workerId },
        { assignedRouteId: before.assignedRouteId ?? null }
      ).catch(() => {});
      console.error('[reallocation] create failed, rolled back:', createErr);
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Reallocation could not be completed' },
        },
        { status: 500 }
      );
    }
  }

  // Audit log - write outside the transaction; failures here must not roll back
  // the reallocation itself. logAudit already swallows its own errors.
  if (reallocationDoc) {
    const [worker, fromRoute, toRoute] = await Promise.all([
      User.findById(workerId).select('employeeId name').lean(),
      Route.findById(fromRouteId).select('code name ward').lean(),
      Route.findById(toRouteId).select('code name ward').lean(),
    ]);

    const workerLabel = worker
      ? `${worker.employeeId} ${worker.name?.first ?? ''} ${worker.name?.last ?? ''}`.trim()
      : (workerId as string);

    await logAudit({
      action: 'reallocation.approved',
      category: 'reallocation',
      actorId: supervisorId,
      actorEmployeeId: supervisorEmployeeId,
      actorRole: 'supervisor',
      targetType: 'reallocation',
      targetId: (reallocationDoc as { _id: mongoose.Types.ObjectId })._id.toString(),
      targetLabel: workerLabel,
      changes: {
        assignedRouteId: {
          from: fromRoute ? `${fromRoute.code} ${fromRoute.name}` : fromRouteId,
          to: toRoute ? `${toRoute.code} ${toRoute.name}` : toRouteId,
        },
      },
      metadata: {
        reason,
        distanceBetweenRoutes,
        previousStaffingRatio,
        newStaffingRatio,
        usedTransaction,
      },
      ward: toRoute?.ward,
      req,
    });
  }

  return NextResponse.json({ success: true, data: reallocationDoc });
}

/**
 * GET /api/reallocation - Get reallocation history
 */
export async function GET(req: NextRequest) {
  const { error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || todayIST();

  const records = await Reallocation.find({ date })
    .populate('workerId', 'employeeId name')
    .populate('fromRouteId', 'name code')
    .populate('toRouteId', 'name code')
    .populate('supervisorId', 'employeeId name')
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ success: true, data: records });
}
