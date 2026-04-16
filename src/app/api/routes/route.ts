import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Route } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { createRouteSchema } from '@/lib/validators/schemas';

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

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = createRouteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const route = await Route.create(parsed.data);

  return NextResponse.json({ success: true, data: route }, { status: 201 });
}
