import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { NotificationLog } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';

/**
 * GET /api/notifications?cursor=<id>&limit=20&filter=all|unread
 *
 * Paginated inbox for the current user. Cursor-based using the
 * notification's _id (descending), so the natural order is most
 * recent first.
 */
export async function GET(req: NextRequest) {
  const { session, error } = await requireRole('supervisor', 'admin', 'staff');
  if (error) return error;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const limitRaw = Number(searchParams.get('limit') ?? '20');
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 20, 1), 100);
  const cursor = searchParams.get('cursor');
  const filter = searchParams.get('filter') === 'unread' ? 'unread' : 'all';

  const query: Record<string, unknown> = { recipientId: session!.user.id };
  if (filter === 'unread') query.readAt = null;
  if (cursor) query._id = { $lt: cursor };

  const [items, unreadCount, totalCount] = await Promise.all([
    NotificationLog.find(query).sort({ _id: -1 }).limit(limit + 1).lean(),
    NotificationLog.countDocuments({ recipientId: session!.user.id, readAt: null }),
    NotificationLog.countDocuments({ recipientId: session!.user.id }),
  ]);

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? page[page.length - 1]._id.toString() : null;

  return NextResponse.json({
    success: true,
    data: {
      items: page.map((n) => ({
        id: n._id.toString(),
        kind: n.kind,
        title: n.title,
        body: n.body,
        url: n.url,
        tag: n.tag,
        context: n.context,
        pushDelivered: n.pushDelivered,
        readAt: n.readAt,
        clickedAt: n.clickedAt,
        createdAt: n.createdAt,
      })),
      nextCursor,
      hasMore,
      unreadCount,
      totalCount,
    },
  });
}
