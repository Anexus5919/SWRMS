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
 * PUT /api/staff/[staffId] — Update staff
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  const { error } = await requireRole('admin');
  if (error) return error;

  await connectDB();
  const { staffId } = await params;
  const body = await req.json();

  // Don't allow password updates through this endpoint
  delete body.passwordHash;
  delete body.password;

  const user = await User.findByIdAndUpdate(staffId, body, { new: true })
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
