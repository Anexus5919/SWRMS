import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * PushSubscription - one row per (user, browser/device) Web Push endpoint.
 *
 * Web Push uses an opaque endpoint URL plus two crypto keys (`p256dh` and
 * `auth`). The browser hands these to JS via `pushManager.subscribe(...)`;
 * we POST them to /api/push/subscribe which writes a row here.
 *
 * The endpoint URL is unique per browser install - we use it as the
 * upsert key so re-enabling notifications in the same browser updates
 * the row instead of creating duplicates.
 *
 * Subscriptions are best-effort. If web-push returns 404 / 410 (the
 * subscription was revoked at the browser), the sender deletes the row.
 */

export interface IPushSubscription extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'admin' | 'supervisor' | 'staff';
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  /** Free-form label so supervisors can recognise their devices. */
  userAgent?: string | null;
  createdAt: Date;
  /** Last time we successfully delivered a push to this endpoint. */
  lastUsedAt?: Date | null;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, enum: ['admin', 'supervisor', 'staff'], required: true, index: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  userAgent: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date, default: null },
});

// Most pushes are sent to "all supervisors" - this index keeps that fast.
PushSubscriptionSchema.index({ role: 1, userId: 1 });

const PushSubscription: Model<IPushSubscription> =
  mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);

export default PushSubscription;
