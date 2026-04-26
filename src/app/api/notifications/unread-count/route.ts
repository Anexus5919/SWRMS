import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { NotificationLog } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';

/**
 * GET /api/notifications/unread-count
 *
 * Cheap polling endpoint for the bell-icon badge. Returns just the
 * integer count plus a freshness timestamp so the client can dedupe.
 */
export async function GET() {
  const { session, error } = await requireRole('supervisor', 'admin', 'staff');
  if (error) return error;

  await connectDB();

  const unread = await NotificationLog.countDocuments({
    recipientId: session!.user.id,
    readAt: null,
  });

  return NextResponse.json({
    success: true,
    data: { unread, asOf: new Date().toISOString() },
  });
}
