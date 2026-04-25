import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Route } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';

/**
 * GET /api/routes/[routeId] - Get a single route
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  const { error } = await requireRole('staff', 'supervisor', 'admin');
  if (error) return error;

  await connectDB();
  const { routeId } = await params;

  const route = await Route.findById(routeId).lean();
  if (!route) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: route });
}

/**
 * PUT /api/routes/[routeId] - Update route (admin)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  const { error } = await requireRole('admin');
  if (error) return error;

  await connectDB();
  const { routeId } = await params;
  const body = await req.json();

  const route = await Route.findByIdAndUpdate(routeId, body, { new: true }).lean();
  if (!route) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: route });
}

/**
 * DELETE /api/routes/[routeId] - Deactivate route (admin)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  const { error } = await requireRole('admin');
  if (error) return error;

  await connectDB();
  const { routeId } = await params;

  const route = await Route.findByIdAndUpdate(
    routeId,
    { status: 'inactive' },
    { new: true }
  ).lean();

  if (!route) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: route });
}
