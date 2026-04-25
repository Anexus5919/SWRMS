import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVerificationLog extends Document {
  _id: mongoose.Types.ObjectId;
  type: 'missing_photo' | 'face_mismatch' | 'no_face_detected' | 'headcount_mismatch' | 'location_anomaly' | 'manual_override';
  severity: 'info' | 'warning' | 'critical';
  routeId: mongoose.Types.ObjectId;
  date: string;
  affectedUserId: mongoose.Types.ObjectId | null;
  geoPhotoId: mongoose.Types.ObjectId | null;
  details: {
    message: string;
    expectedCount?: number;
    actualCount?: number;
    faceDistance?: number;
    coordinates?: { lat: number; lng: number };
    photoUrl?: string; // base64 reference for manual check
    /** Sub-kind for location_anomaly: 'route_deviation' | 'idle' | 'mock_location'. */
    kind?: 'route_deviation' | 'idle' | 'mock_location';
    distanceMeters?: number;
    thresholdMeters?: number;
    spanMeters?: number;
    windowMinutes?: number;
  };
  resolution: {
    status: 'open' | 'acknowledged' | 'resolved' | 'dismissed';
    resolvedBy: mongoose.Types.ObjectId | null;
    resolvedAt: Date | null;
    notes: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

const VerificationLogSchema = new Schema<IVerificationLog>(
  {
    type: {
      type: String,
      enum: ['missing_photo', 'face_mismatch', 'no_face_detected', 'headcount_mismatch', 'location_anomaly', 'manual_override'],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      required: true,
      index: true,
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
      validate: /^\d{4}-\d{2}-\d{2}$/,
    },
    affectedUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    geoPhotoId: {
      type: Schema.Types.ObjectId,
      ref: 'GeoPhoto',
      default: null,
    },
    details: {
      message: { type: String, required: true },
      expectedCount: Number,
      actualCount: Number,
      faceDistance: Number,
      coordinates: {
        lat: Number,
        lng: Number,
      },
      photoUrl: String,
      kind: { type: String, enum: ['route_deviation', 'idle', 'mock_location', null], default: null },
      distanceMeters: Number,
      thresholdMeters: Number,
      spanMeters: Number,
      windowMinutes: Number,
    },
    resolution: {
      status: {
        type: String,
        enum: ['open', 'acknowledged', 'resolved', 'dismissed'],
        default: 'open',
      },
      resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      resolvedAt: { type: Date, default: null },
      notes: { type: String, default: null },
    },
  },
  { timestamps: true }
);

VerificationLogSchema.index({ date: 1, type: 1, severity: 1 });
VerificationLogSchema.index({ 'resolution.status': 1 });

const VerificationLog: Model<IVerificationLog> =
  mongoose.models.VerificationLog || mongoose.model<IVerificationLog>('VerificationLog', VerificationLogSchema);

export default VerificationLog;
