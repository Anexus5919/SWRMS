import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { User } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';

/**
 * GET /api/staff/[staffId] — Get staff detail
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  const { error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  await connectDB();
  const { staffId } = await params;

  const user = await User.findById(staffId)
    .select('-passwordHash')
    .populate('assignedRouteId', 'name code')
    .lean();

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Staff not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: user });
}

/**
 * PUT /api/staff/[staffId] — Update staff (whitelisted fields only)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  const { error } = await requireRole('admin');
  if (error) return error;

  try {
    await connectDB();
    const { staffId } = await params;
    const body = await req.json();

    // Whitelist allowed fields — prevents role escalation and password tampering
    const ALLOWED_FIELDS = ['name', 'phone', 'ward', 'assignedRouteId', 'isActive'];
    const sanitized: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (body[key] !== undefined) {
        sanitized[key] = body[key];
      }
    }

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_CHANGES', message: 'No valid fields to update' } },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(staffId, sanitized, { new: true })
      .select('-passwordHash -faceDescriptor')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Staff not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update staff' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/staff/[staffId] — Deactivate staff
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  const { error } = await requireRole('admin');
  if (error) return error;

  await connectDB();
  const { staffId } = await params;

  const user = await User.findByIdAndUpdate(
    staffId,
    { isActive: false },
    { new: true }
  )
    .select('-passwordHash')
    .lean();

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Staff not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: user });
}
