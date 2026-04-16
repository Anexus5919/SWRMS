import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db/connection';
import { User } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';

/**
 * GET /api/staff — List staff members
 */
export async function GET(req: NextRequest) {
  const { error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');
  const routeId = searchParams.get('routeId');

  const filter: Record<string, unknown> = { isActive: true };
  if (role) filter.role = role;
  if (routeId) filter.assignedRouteId = routeId;

  const staff = await User.find(filter)
    .select('-passwordHash')
    .populate('assignedRouteId', 'name code')
    .sort({ employeeId: 1 })
    .lean();

  return NextResponse.json({ success: true, data: staff });
}

/**
 * POST /api/staff — Register new staff
 */
export async function POST(req: NextRequest) {
  const { error } = await requireRole('admin');
  if (error) return error;

  await connectDB();
  const body = await req.json();

  const { employeeId, firstName, lastName, role, phone, password, assignedRouteId } = body;

  if (!employeeId || !firstName || !lastName || !role || !phone || !password) {
    return NextResponse.json(
      { success: false, error: { code: 'MISSING_FIELDS', message: 'All fields are required' } },
      { status: 400 }
    );
  }

  // Check duplicate
  const existing = await User.findOne({ employeeId });
  if (existing) {
    return NextResponse.json(
      { success: false, error: { code: 'DUPLICATE', message: 'Employee ID already exists' } },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    employeeId,
    name: { first: firstName, last: lastName },
    role,
    phone,
    passwordHash,
    assignedRouteId: assignedRouteId || null,
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
    },
    { status: 201 }
  );
}
