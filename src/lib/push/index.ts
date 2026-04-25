import webpush from 'web-push';
import { PushSubscription as PushSubscriptionModel } from '../db/models';
import type { IPushSubscription } from '../db/models';

/**
 * Web Push helper. Wraps `web-push` so callers don't have to know about
 * VAPID, and centralises the cleanup logic for revoked subscriptions.
 *
 * Configuration is read from env on first use:
 *   - NEXT_PUBLIC_VAPID_PUBLIC_KEY  (also exposed to client for `subscribe()`)
 *   - VAPID_PRIVATE_KEY             (server-only)
 *   - VAPID_SUBJECT                 (mailto:ops@bmc.example, or https URL)
 *
 * Each push is signed with VAPID so push services (FCM / Mozilla / WebPush)
 * trust the sender. If a subscription endpoint returns 404 or 410 it has
 * been revoked at the browser; we delete the row immediately so we don't
 * keep blasting unreachable endpoints.
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
}

/** Send one push. Returns `true` on success, `false` if the subscription
 *  was revoked (and we deleted it). Other errors propagate. */
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
      { TTL: 60 * 60 } // 1 hour — drop the push if not delivered
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
      // Endpoint is permanently gone — clean up so we don't keep retrying.
      await PushSubscriptionModel.deleteOne({ _id: sub._id });
      return false;
    }
    throw err;
  }
}

/** Send to every subscriber matching `query`. Returns counts of attempts. */
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
