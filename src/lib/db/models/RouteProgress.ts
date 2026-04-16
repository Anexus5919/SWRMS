import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProgressUpdate {
  time: Date;
  percentage: number;
  updatedBy: mongoose.Types.ObjectId;
  note?: string;
}

export interface IRouteProgress extends Document {
  _id: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  date: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'stalled';
  completionPercentage: number;
  staffingSnapshot: {
    required: number;
    present: number;
    ratio: number;
  };
  updates: IProgressUpdate[];
  lastGPSPing?: {
    lat: number;
    lng: number;
    time: Date;
    workerId: mongoose.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

const RouteProgressSchema = new Schema<IRouteProgress>(
  {
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'stalled'],
      default: 'not_started',
    },
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    staffingSnapshot: {
      required: { type: Number, default: 0 },
      present: { type: Number, default: 0 },
      ratio: { type: Number, default: 0 },
    },
    updates: [
      {
        time: Date,
        percentage: Number,
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        note: String,
      },
    ],
    lastGPSPing: {
      lat: Number,
      lng: Number,
      time: Date,
      workerId: { type: Schema.Types.ObjectId, ref: 'User' },
    },
  },
  { timestamps: true }
);

// One progress record per route per day
RouteProgressSchema.index({ routeId: 1, date: 1 }, { unique: true });
// Dashboard query: all routes for today
RouteProgressSchema.index({ date: 1 });

const RouteProgress: Model<IRouteProgress> =
  mongoose.models.RouteProgress ||
  mongoose.model<IRouteProgress>('RouteProgress', RouteProgressSchema);

export default RouteProgress;
