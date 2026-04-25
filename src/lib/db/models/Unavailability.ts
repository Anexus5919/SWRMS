import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Unavailability - a worker's self-declared "I cannot come in today" record.
 *
 * Created when a staff member taps the "Unable to work today" button on their
 * home screen *before* the attendance window closes. This gives the supervisor
 * an early signal so they can request reallocation rather than waiting for
 * the worker to simply not check in (which only becomes visible after the
 * window closes).
 *
 * One record per (userId, date). A worker who already marked attendance
 * cannot subsequently mark themselves unavailable for the same date.
 */

export interface IUnavailability extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: string;                            // YYYY-MM-DD (IST)
  reason: 'sick' | 'personal' | 'transport' | 'other';
  notes?: string | null;
  declaredAt: Date;
  /** routeId at time of declaration (denormalized for reports). */
  routeId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const UnavailabilitySchema = new Schema<IUnavailability>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true, validate: /^\d{4}-\d{2}-\d{2}$/ },
    reason: {
      type: String,
      enum: ['sick', 'personal', 'transport', 'other'],
      required: true,
    },
    notes: { type: String, default: null, maxlength: 500 },
    declaredAt: { type: Date, default: () => new Date() },
    routeId: { type: Schema.Types.ObjectId, ref: 'Route', default: null, index: true },
  },
  { timestamps: true }
);

UnavailabilitySchema.index({ userId: 1, date: 1 }, { unique: true });
UnavailabilitySchema.index({ date: 1, routeId: 1 });

const Unavailability: Model<IUnavailability> =
  mongoose.models.Unavailability ||
  mongoose.model<IUnavailability>('Unavailability', UnavailabilitySchema);

export default Unavailability;
