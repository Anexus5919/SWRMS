import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReallocation extends Document {
  _id: mongoose.Types.ObjectId;
  fromRouteId: mongoose.Types.ObjectId;
  toRouteId: mongoose.Types.ObjectId;
  workerId: mongoose.Types.ObjectId;
  supervisorId: mongoose.Types.ObjectId;
  date: string;
  reason: 'understaffed' | 'route_completed' | 'manual';
  status: 'suggested' | 'approved' | 'rejected' | 'completed';
  distanceBetweenRoutes?: number;
  previousStaffingRatio?: number;
  newStaffingRatio?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReallocationSchema = new Schema<IReallocation>(
  {
    fromRouteId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    toRouteId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    workerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    supervisorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      enum: ['understaffed', 'route_completed', 'manual'],
      required: true,
    },
    status: {
      type: String,
      enum: ['suggested', 'approved', 'rejected', 'completed'],
      default: 'suggested',
    },
    distanceBetweenRoutes: Number,
    previousStaffingRatio: Number,
    newStaffingRatio: Number,
  },
  { timestamps: true }
);

ReallocationSchema.index({ date: 1, status: 1 });

const Reallocation: Model<IReallocation> =
  mongoose.models.Reallocation ||
  mongoose.model<IReallocation>('Reallocation', ReallocationSchema);

export default Reallocation;
