import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Checkpoint - a physical NFC tag or QR sticker placed along a route.
 *
 * Workers tap (NFC) or scan (QR) a checkpoint as they pass it. The scan
 * deterministically advances RouteProgress.completionPercentage rather
 * than relying on noisy GPS distance calculations - especially valuable
 * in narrow Mumbai lanes where GPS drifts 20-50m (per the project
 * report, section 4.4).
 *
 * One Checkpoint document per physical sticker. The `code` is the value
 * encoded in the NFC tag / printed on the QR sticker.
 */

export interface ICheckpoint extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;                            // unique scanner payload
  routeId: mongoose.Types.ObjectId;
  /** Human-readable label printed on the sticker for visual confirmation. */
  label: string;
  /** Geographic position of the sticker (for sanity-check on scans). */
  coordinates: { lat: number; lng: number };
  /** Order along the route, 1-indexed; controls completion-percentage math. */
  order: number;
  /** false = retired sticker; scans rejected. */
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CheckpointSchema = new Schema<ICheckpoint>(
  {
    code: { type: String, required: true, unique: true, index: true },
    routeId: { type: Schema.Types.ObjectId, ref: 'Route', required: true, index: true },
    label: { type: String, required: true, maxlength: 200 },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    order: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

CheckpointSchema.index({ routeId: 1, order: 1 });

const Checkpoint: Model<ICheckpoint> =
  mongoose.models.Checkpoint || mongoose.model<ICheckpoint>('Checkpoint', CheckpointSchema);

export default Checkpoint;

/**
 * CheckpointScan - record of a worker scanning a checkpoint sticker.
 *
 * Composite uniqueness on (workerId, checkpointId, date) so a worker
 * scanning the same sticker twice in one shift counts only once.
 */

export interface ICheckpointScan extends Document {
  _id: mongoose.Types.ObjectId;
  checkpointId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  workerId: mongoose.Types.ObjectId;
  date: string;                            // YYYY-MM-DD (IST)
  scannedAt: Date;
  method: 'nfc' | 'qr';
  /** GPS captured at scan time, used to verify scanner is at the sticker location. */
  coordinates?: { lat: number; lng: number; accuracy?: number | null } | null;
  /** Distance (m) from the scan position to the checkpoint coords. */
  distanceFromCheckpointMeters?: number | null;
  /** True if the scan is sufficiently close to the checkpoint to be trusted. */
  trusted: boolean;
  createdAt: Date;
}

const CheckpointScanSchema = new Schema<ICheckpointScan>(
  {
    checkpointId: { type: Schema.Types.ObjectId, ref: 'Checkpoint', required: true, index: true },
    routeId: { type: Schema.Types.ObjectId, ref: 'Route', required: true, index: true },
    workerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true },
    scannedAt: { type: Date, default: () => new Date() },
    method: { type: String, enum: ['nfc', 'qr'], required: true },
    coordinates: {
      lat: Number,
      lng: Number,
      accuracy: Number,
    },
    distanceFromCheckpointMeters: { type: Number, default: null },
    trusted: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

CheckpointScanSchema.index({ workerId: 1, checkpointId: 1, date: 1 }, { unique: true });
CheckpointScanSchema.index({ routeId: 1, date: 1, scannedAt: 1 });

export const CheckpointScan: Model<ICheckpointScan> =
  mongoose.models.CheckpointScan ||
  mongoose.model<ICheckpointScan>('CheckpointScan', CheckpointScanSchema);
