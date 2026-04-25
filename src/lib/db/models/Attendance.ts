import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendance extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  date: string; // "YYYY-MM-DD"
  checkInTime: Date;
  coordinates: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  distanceFromRoute: number; // meters
  status: 'verified' | 'rejected' | 'pending_sync';
  rejectionReason?: string;
  attempts: number;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
  };
  /** True if device's Geolocation API said the position came from a mock provider. */
  mockLocation?: boolean;
  /** Difference in seconds between client clock and server clock. */
  clockDriftSeconds?: number | null;
  isOfflineSync: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
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
    },
    checkInTime: {
      type: Date,
      required: true,
    },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      accuracy: Number,
    },
    distanceFromRoute: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['verified', 'rejected', 'pending_sync'],
      required: true,
    },
    rejectionReason: String,
    attempts: {
      type: Number,
      default: 1,
    },
    deviceInfo: {
      userAgent: String,
      platform: String,
    },
    mockLocation: { type: Boolean, default: false },
    clockDriftSeconds: { type: Number, default: null },
    isOfflineSync: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// One attendance record per user per day
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
// Dashboard queries: all attendance for a route on a date
AttendanceSchema.index({ routeId: 1, date: 1 });

const Attendance: Model<IAttendance> =
  mongoose.models.Attendance ||
  mongoose.model<IAttendance>('Attendance', AttendanceSchema);

export default Attendance;
