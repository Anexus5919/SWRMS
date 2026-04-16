import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGeoPhoto extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  type: 'shift_start' | 'checkpoint' | 'shift_end';
  photo: string; // base64 compressed JPEG
  coordinates: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  faceDetected: boolean;
  facesCount: number;
  faceDescriptor: number[] | null; // 128-d embedding of detected face
  verificationResult: {
    confidence: 'high' | 'medium' | 'low' | 'no_match' | 'no_face';
    distance: number | null;
    verified: boolean;
    requiresManualReview: boolean;
    message: string;
  };
  manualReview: {
    status: 'pending' | 'approved' | 'rejected' | 'not_required';
    reviewedBy: mongoose.Types.ObjectId | null;
    reviewedAt: Date | null;
    notes: string | null;
  };
  deviceInfo: {
    userAgent?: string;
    platform?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const GeoPhotoSchema = new Schema<IGeoPhoto>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
    type: {
      type: String,
      enum: ['shift_start', 'checkpoint', 'shift_end'],
      required: true,
    },
    photo: {
      type: String,
      required: true,
    },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      accuracy: { type: Number },
    },
    faceDetected: { type: Boolean, default: false },
    facesCount: { type: Number, default: 0 },
    faceDescriptor: {
      type: [Number],
      default: null,
    },
    verificationResult: {
      confidence: {
        type: String,
        enum: ['high', 'medium', 'low', 'no_match', 'no_face'],
        default: 'no_face',
      },
      distance: { type: Number, default: null },
      verified: { type: Boolean, default: false },
      requiresManualReview: { type: Boolean, default: false },
      message: { type: String, default: '' },
    },
    manualReview: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'not_required'],
        default: 'not_required',
      },
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      reviewedAt: { type: Date, default: null },
      notes: { type: String, default: null },
    },
    deviceInfo: {
      userAgent: String,
      platform: String,
    },
  },
  { timestamps: true }
);

GeoPhotoSchema.index({ userId: 1, date: 1, type: 1 });
GeoPhotoSchema.index({ routeId: 1, date: 1 });
GeoPhotoSchema.index({ 'manualReview.status': 1, date: 1 });

const GeoPhoto: Model<IGeoPhoto> =
  mongoose.models.GeoPhoto || mongoose.model<IGeoPhoto>('GeoPhoto', GeoPhotoSchema);

export default GeoPhoto;
