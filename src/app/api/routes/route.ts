import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Route } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';

/**
 * GET /api/routes — List all routes
 */
export async function GET() {
  const { error } = await requireRole('staff', 'supervisor', 'admin');
  if (error) return error;

  await connectDB();

  const routes = await Route.find({ status: 'active' })
    .sort({ code: 1 })
    .lean();

  return NextResponse.json({ success: true, data: routes });
}

/**
 * POST /api/routes — Create a new route (admin)
 */
export async function POST(req: NextRequest) {
  const { error } = await requireRole('admin');
  if (error) return error;

  await connectDB();
  const body = await req.json();

  const route = await Route.create(body);

  return NextResponse.json({ success: true, data: route }, { status: 201 });
}
