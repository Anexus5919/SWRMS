import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { AuditLog } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';

/**
 * GET /api/audit - list audit log entries (admin only)
 * Query params: category, action, actorId, q (search), page, limit, from, to
 */
export async function GET(req: NextRequest) {
  const { error } = await requireRole('admin');
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const action = searchParams.get('action');
    const actorId = searchParams.get('actorId');
    const q = searchParams.get('q');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (action) filter.action = action;
    if (actorId) filter.actorId = actorId;
    if (from || to) {
      const range: Record<string, Date> = {};
      if (from) range.$gte = new Date(from);
      if (to) range.$lte = new Date(to);
      filter.createdAt = range;
    }
    if (q) {
      filter.$or = [
        { actorEmployeeId: { $regex: q, $options: 'i' } },
        { targetLabel: { $regex: q, $options: 'i' } },
      ];
    }

    const [entries, total, summary] = await Promise.all([
      AuditLog.find(filter)
        .populate('actorId', 'employeeId name role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
      AuditLog.aggregate([
        { $match: filter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
    ]);

    return NextResponse.json({
      success: true,
      data: entries,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary,
    });
  } catch (err) {
    console.error('Audit fetch error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch audit log' } },
      { status: 500 }
    );
  }
}
