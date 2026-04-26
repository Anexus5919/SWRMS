import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db/connection';
import { NotificationLog } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';

/**
 * POST /api/notifications/:id/read
 *
 * Marks one notification read for the current user. Body may include
 * `{ "via": "click" }` to additionally set `clickedAt` — used by the
 * service worker when the OS notification itself is clicked.
 *
 * A user can only mark their own notifications.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole('supervisor', 'admin', 'staff');
  if (error) return error;

  const { id } = await ctx.params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_ID', message: 'Invalid notification id' } },
      { status: 400 }
    );
  }

  let via: 'click' | 'inbox' = 'inbox';
  try {
    const body = await req.json();
    if (body?.via === 'click') via = 'click';
  } catch {
    // No body — defaults to "inbox".
  }

  await connectDB();
  const now = new Date();

  const update: Record<string, unknown> = { $set: { readAt: now } };
  if (via === 'click') {
    update.$set = { ...(update.$set as Record<string, unknown>), clickedAt: now };
  }

  const result = await NotificationLog.findOneAndUpdate(
    { _id: id, recipientId: session!.user.id },
    update,
    { new: true }
  ).lean();

  if (!result) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
