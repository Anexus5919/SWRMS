import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * NotificationLog - one row per (alert, recipient) pair.
 *
 * Every push the system sends produces a row here, even if the
 * recipient has no active push subscription. That makes the inbox a
 * **complete record of what should have reached each supervisor**,
 * decoupled from whether the browser endpoint was alive at the
 * moment of delivery - important for govt-portal record keeping.
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

/**
 * Closed set of notification kinds. Each kind maps to a specific staff
 * action or system event that supervisors / admins should see.
 *
 * Naming: <subject>_<event>. The subject is what was acted on (the
 * staff member, the photo, the route) and the event is what happened.
 *
 * Add new kinds here AND extend the enum on the schema below AND extend
 * the kindLabels / kindBadgeVariant maps in src/app/notifications/page.tsx.
 */
export type NotificationKind =
  // Attendance
  | 'attendance_marked'         // Staff verified attendance (geofence pass)
  | 'attendance_face_flag'      // Face-confidence below threshold (manual review)
  | 'attendance_synced'         // Offline attendance backlog synced
  // Photo verification
  | 'photo_submitted'           // Shift-start / checkpoint / shift-end photo OK
  | 'photo_face_flag'           // Photo's face match below threshold or no face detected
  | 'photo_missing'             // 30+ min after attendance, no shift-start photo
  // Route progress
  | 'route_progress'            // Staff bumped progress (25/50/75%)
  | 'route_completed'           // Staff marked route 100%
  // Live tracking
  | 'route_deviation'           // Two consecutive off-route pings
  | 'idle_alert'                // Stationary 10+ min
  | 'mock_location'             // Device flagged mock-GPS
  | 'missed_shift'              // 06:30 IST - neither attendance nor unavailability
  // Other staff actions
  | 'unavailability_declared'   // Staff declared sick/personal/transport/other
  | 'checkpoint_scanned'        // NFC / QR checkpoint hit
  // Supervisor actions
  | 'reallocation_executed'     // Supervisor reassigned worker mid-shift
  // Generic
  | 'manual';                   // Free-form admin broadcast

export interface INotificationLog extends Document {
  _id: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  recipientRole: 'admin' | 'supervisor' | 'staff';
  kind: NotificationKind;
  title: string;
  body: string;
  /** URL the inbox / OS notification opens on click. */
  url: string;
  /** OS-level grouping tag - same tag replaces the prior notification. */
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
      'attendance_marked',
      'attendance_face_flag',
      'attendance_synced',
      'photo_submitted',
      'photo_face_flag',
      'photo_missing',
      'route_progress',
      'route_completed',
      'route_deviation',
      'idle_alert',
      'mock_location',
      'missed_shift',
      'unavailability_declared',
      'checkpoint_scanned',
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
