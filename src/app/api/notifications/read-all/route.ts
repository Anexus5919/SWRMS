import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { NotificationLog } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';

/**
 * POST /api/notifications/read-all
 *
 * Marks every unread notification for the current user as read.
 * Useful for a "Mark all as read" button on the inbox.
 */
export async function POST() {
  const { session, error } = await requireRole('supervisor', 'admin', 'staff');
  if (error) return error;

  await connectDB();

  const result = await NotificationLog.updateMany(
    { recipientId: session!.user.id, readAt: null },
    { $set: { readAt: new Date() } }
  );

  return NextResponse.json({
    success: true,
    data: { updated: result.modifiedCount },
  });
}
