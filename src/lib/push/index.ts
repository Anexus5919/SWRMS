import webpush from 'web-push';
import {
  PushSubscription as PushSubscriptionModel,
  NotificationLog,
  User,
} from '../db/models';
import type { IPushSubscription, NotificationKind } from '../db/models';

/**
 * Web Push helper + notification recording.
 *
 * The high-level entry point is `recordAndPush({recipientsQuery, ...})`:
 *   1. Resolves the set of recipient users (e.g. all supervisors+admins).
 *   2. Writes one NotificationLog row per recipient - even if the recipient
 *      has no live push subscription. The inbox is therefore a complete
 *      record of "what alert was supposed to reach this person", which is
 *      the right primitive for govt-portal record keeping.
 *   3. For recipients who DO have push subscriptions, attempts delivery
 *      and updates the corresponding log row's `pushDelivered` flag.
 *
 * Lower-level `sendPushTo` / `sendPushToAll` are still exported for
 * direct delivery scenarios that don't need the log (admin debug pings).
 *
 * VAPID config is read from env on first use:
 *   - NEXT_PUBLIC_VAPID_PUBLIC_KEY  (also exposed to client for subscribe)
 *   - VAPID_PRIVATE_KEY             (server-only)
 *   - VAPID_SUBJECT                 (mailto: or https URL)
 *
 * Subscriptions returning 404/410 are deleted immediately - they were
 * revoked at the browser and we shouldn't keep retrying.
 */

let configured = false;
function configure(): void {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:ops@bmc.example';
  if (!publicKey || !privateKey) {
    throw new Error(
      'VAPID keys missing. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env.local. ' +
        'Generate a pair with: npx web-push generate-vapid-keys'
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  /** Tag groups notifications: a new push with the same tag replaces the old. */
  tag?: string;
  /** URL to open when the user clicks the notification. */
  url?: string;
  /** Optional small icon path (defaults to /bmc_logo.png). */
  icon?: string;
  /** NotificationLog id - service worker pings /api/notifications/:id/read on click. */
  notificationId?: string;
}

/** Send one push. Returns true on success, false if the subscription was
 *  revoked (and we deleted it). Other errors propagate. */
export async function sendPushTo(
  sub: IPushSubscription,
  payload: PushPayload
): Promise<boolean> {
  configure();
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 } // 1 hour - drop the push if not delivered
    );
    sub.lastUsedAt = new Date();
    await sub.save();
    return true;
  } catch (err: unknown) {
    const status =
      err && typeof err === 'object' && 'statusCode' in err
        ? (err as { statusCode: number }).statusCode
        : 0;
    if (status === 404 || status === 410) {
      await PushSubscriptionModel.deleteOne({ _id: sub._id });
      return false;
    }
    throw err;
  }
}

/** Send to every subscriber matching `query`. No NotificationLog rows
 *  are written - used for one-off admin debug pings. */
export async function sendPushToAll(
  query: Record<string, unknown>,
  payload: PushPayload
): Promise<{ sent: number; revoked: number; failed: number }> {
  const subs = await PushSubscriptionModel.find(query);
  let sent = 0;
  let revoked = 0;
  let failed = 0;
  for (const sub of subs) {
    try {
      const ok = await sendPushTo(sub, payload);
      if (ok) sent += 1;
      else revoked += 1;
    } catch {
      failed += 1;
    }
  }
  return { sent, revoked, failed };
}

export interface RecordAndPushOptions {
  /** Mongo query selecting the recipient users (e.g. role: 'supervisor'). */
  recipientsQuery: Record<string, unknown>;
  kind: NotificationKind;
  title: string;
  body: string;
  url: string;
  tag?: string;
  /** Structured context for inbox UI (counts, codes, ward, …). */
  context?: Record<string, unknown>;
}

export interface RecordAndPushResult {
  recipients: number;
  pushSent: number;
  pushRevoked: number;
  pushFailed: number;
  /** NotificationLog ids written, in case the caller wants to surface them. */
  notificationIds: string[];
}

/**
 * Canonical "send an alert to a group" path.
 *
 * Step 1 - resolve recipients.
 * Step 2 - write one NotificationLog row per recipient (pushDelivered=false).
 * Step 3 - for every recipient who has a push subscription, attempt delivery
 *          and flip pushDelivered=true on success. The push payload includes
 *          notificationId so the service worker can mark the row clickedAt
 *          when the user taps the OS notification.
 */
export async function recordAndPush(
  opts: RecordAndPushOptions
): Promise<RecordAndPushResult> {
  const recipients = await User.find({ ...opts.recipientsQuery, isActive: true })
    .select('_id role')
    .lean();

  if (recipients.length === 0) {
    return { recipients: 0, pushSent: 0, pushRevoked: 0, pushFailed: 0, notificationIds: [] };
  }

  // Step 1+2: insert one log per recipient. Use insertMany for one round-trip.
  const now = new Date();
  const docs = recipients.map((r) => ({
    recipientId: r._id,
    recipientRole: r.role,
    kind: opts.kind,
    title: opts.title,
    body: opts.body,
    url: opts.url,
    tag: opts.tag ?? null,
    context: opts.context ?? null,
    pushDelivered: false,
    pushAttemptedAt: now,
    readAt: null,
    clickedAt: null,
    createdAt: now,
  }));
  const inserted = await NotificationLog.insertMany(docs);
  const notificationByRecipient = new Map<string, (typeof inserted)[number]>();
  for (const doc of inserted) {
    notificationByRecipient.set(doc.recipientId.toString(), doc);
  }

  // Step 3: deliver to recipients with active subscriptions.
  const recipientIds = recipients.map((r) => r._id);
  const subs = await PushSubscriptionModel.find({ userId: { $in: recipientIds } });

  let pushSent = 0;
  let pushRevoked = 0;
  let pushFailed = 0;

  for (const sub of subs) {
    const log = notificationByRecipient.get(sub.userId.toString());
    const payload: PushPayload = {
      title: opts.title,
      body: opts.body,
      tag: opts.tag,
      url: opts.url,
      notificationId: log?._id.toString(),
    };
    try {
      const ok = await sendPushTo(sub, payload);
      if (ok) {
        pushSent += 1;
        if (log) {
          log.pushDelivered = true;
          await log.save();
        }
      } else {
        pushRevoked += 1;
      }
    } catch {
      pushFailed += 1;
    }
  }

  return {
    recipients: recipients.length,
    pushSent,
    pushRevoked,
    pushFailed,
    notificationIds: inserted.map((d) => d._id.toString()),
  };
}
