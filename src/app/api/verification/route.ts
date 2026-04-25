import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { VerificationLog } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { resolveLogSchema } from '@/lib/validators/schemas';
import { todayIST } from '@/lib/utils/timezone';

/**
 * GET /api/verification - List verification logs
 */
export async function GET(req: NextRequest) {
  const { error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || todayIST();
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    const filter: Record<string, unknown> = {};
    if (date !== 'all') filter.date = date;
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (status) filter['resolution.status'] = status;

    const [logs, total] = await Promise.all([
      VerificationLog.find(filter)
        .populate('routeId', 'name code')
        .populate('affectedUserId', 'employeeId name')
        .populate('resolution.resolvedBy', 'employeeId name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      VerificationLog.countDocuments(filter),
    ]);

    // Summary counts
    const summary = await VerificationLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { severity: '$severity', status: '$resolution.status' },
          count: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      summary,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch logs' } },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/verification - Resolve a verification log
 */
export async function PUT(req: NextRequest) {
  const { session, error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  try {
    await connectDB();

    const body = await req.json();
    const { logId, ...rest } = body;

    if (!logId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_ID', message: 'logId is required' } },
        { status: 400 }
      );
    }

    const parsed = resolveLogSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const log = await VerificationLog.findById(logId);
    if (!log) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Log not found' } },
        { status: 404 }
      );
    }

    log.resolution = {
      status: parsed.data.status,
      resolvedBy: session!.user.id as any,
      resolvedAt: new Date(),
      notes: parsed.data.notes || null,
    };

    await log.save();

    return NextResponse.json({ success: true, data: log });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to resolve log' } },
      { status: 500 }
    );
  }
}
