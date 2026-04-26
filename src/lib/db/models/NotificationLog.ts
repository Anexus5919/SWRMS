import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * NotificationLog — one row per (alert, recipient) pair.
 *
 * Every push the system sends produces a row here, even if the
 * recipient has no active push subscription. That makes the inbox a
 * **complete record of what should have reached each supervisor**,
 * decoupled from whether the browser endpoint was alive at the
 * moment of delivery — important for govt-portal record keeping.
 *
 * The bell icon and /notifications inbox both query this collection.
 *
 * Field semantics:
 *   - pushDelivered  : true if web-push returned 2xx for this recipient.
 *                      false if no subscription / 410 / failed transport.
 *   - readAt         : set when the user marks read (click in inbox or
 *                      bulk mark-all-read). Independent of clickedAt.
 *   - clickedAt      : set when the OS notification was clicked, via the
 *                      service worker fetching /api/notifications/:id/read.
 *                      A clicked notification is implicitly read.
 */

export type NotificationKind =
  | 'missed_shift'
  | 'route_deviation'
  | 'idle_alert'
  | 'mock_location'
  | 'reallocation_executed'
  | 'manual';

export interface INotificationLog extends Document {
  _id: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  recipientRole: 'admin' | 'supervisor' | 'staff';
  kind: NotificationKind;
  title: string;
  body: string;
  /** URL the inbox / OS notification opens on click. */
  url: string;
  /** OS-level grouping tag — same tag replaces the prior notification. */
  tag?: string | null;
  /** Structured context for the inbox to render extra UI (counts, codes). */
  context?: Record<string, unknown> | null;
  /** True if web-push returned 2xx. False if no subscription or transport error. */
  pushDelivered: boolean;
  pushAttemptedAt: Date;
  /** Set when user marks read (via inbox click or bulk action). */
  readAt: Date | null;
  /** Set when the OS notification itself was clicked. */
  clickedAt: Date | null;
  createdAt: Date;
}

const NotificationLogSchema = new Schema<INotificationLog>({
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recipientRole: {
    type: String,
    enum: ['admin', 'supervisor', 'staff'],
    required: true,
  },
  kind: {
    type: String,
    enum: [
      'missed_shift',
      'route_deviation',
      'idle_alert',
      'mock_location',
      'reallocation_executed',
      'manual',
    ],
    required: true,
    index: true,
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  url: { type: String, required: true },
  tag: { type: String, default: null },
  context: { type: Schema.Types.Mixed, default: null },
  pushDelivered: { type: Boolean, default: false },
  pushAttemptedAt: { type: Date, default: () => new Date() },
  readAt: { type: Date, default: null },
  clickedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

// Inbox list query: most recent first per recipient.
NotificationLogSchema.index({ recipientId: 1, createdAt: -1 });
// Unread badge count: cheap with this index.
NotificationLogSchema.index({ recipientId: 1, readAt: 1 });

const NotificationLog: Model<INotificationLog> =
  mongoose.models.NotificationLog ||
  mongoose.model<INotificationLog>('NotificationLog', NotificationLogSchema);

export default NotificationLog;
