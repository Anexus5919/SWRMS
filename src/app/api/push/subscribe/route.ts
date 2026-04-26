import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db/connection';
import { PushSubscription } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { checkLimit, rateLimitResponse, LIMITS } from '@/lib/rate-limit';

const subscribeSchema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(200),
  }),
});

/**
 * POST /api/push/subscribe
 *   Body: { endpoint, keys: { p256dh, auth } }
 *
 * Stores or refreshes a Web Push subscription for the current user.
 * Upserts on `endpoint` so re-enabling notifications on the same browser
 * does not create duplicate rows.
 *
 * Open to all authenticated roles - staff can also subscribe (e.g. for
 * future "your supervisor reassigned your route" notifications), but the
 * cron jobs in this codebase only target supervisors / admins today.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('supervisor', 'admin', 'staff');
  if (error) return error;

  const limit = checkLimit(`push:sub:${session!.user.id}`, LIMITS.pushSubscribe.max, LIMITS.pushSubscribe.windowMs);
  if (!limit.ok) return rateLimitResponse(limit);

  await connectDB();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const userAgent = req.headers.get('user-agent')?.slice(0, 300) ?? null;

  await PushSubscription.findOneAndUpdate(
    { endpoint: parsed.data.endpoint },
    {
      $set: {
        userId: session!.user.id,
        role: session!.user.role,
        endpoint: parsed.data.endpoint,
        keys: parsed.data.keys,
        userAgent,
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true, new: true }
  );

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/push/subscribe
 *   Body: { endpoint }
 *
 * Remove a subscription. Idempotent - missing rows are silently OK.
 */
export async function DELETE(req: NextRequest) {
  const { session, error } = await requireRole('supervisor', 'admin', 'staff');
  if (error) return error;

  await connectDB();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = z.object({ endpoint: z.string().url().max(2000) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'endpoint required' } },
      { status: 400 }
    );
  }

  // Only allow a user to unsubscribe their own endpoint.
  await PushSubscription.deleteOne({
    endpoint: parsed.data.endpoint,
    userId: session!.user.id,
  });

  return NextResponse.json({ success: true });
}
