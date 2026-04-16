import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWaypoint {
  lat: number;
  lng: number;
  order: number;
}

export interface IRoute extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  ward: string;
  startPoint: { lat: number; lng: number; label?: string };
  endPoint: { lat: number; lng: number; label?: string };
  waypoints: IWaypoint[];
  estimatedLengthKm: number;
  requiredStaff: number;
  geofenceRadius: number;
  shiftStart: string;
  shiftEnd: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
}

const RouteSchema = new Schema<IRoute>({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    unique: true,
    required: true,
  },
  ward: {
    type: String,
    default: 'Chembur',
  },
  startPoint: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    label: String,
  },
  endPoint: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    label: String,
  },
  waypoints: [
    {
      lat: Number,
      lng: Number,
      order: Number,
    },
  ],
  estimatedLengthKm: {
    type: Number,
    required: true,
  },
  requiredStaff: {
    type: Number,
    required: true,
    min: 1,
  },
  geofenceRadius: {
    type: Number,
    default: 200,
  },
  shiftStart: {
    type: String,
    default: '06:00',
  },
  shiftEnd: {
    type: String,
    default: '14:00',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

RouteSchema.index({ 'startPoint.lat': 1, 'startPoint.lng': 1 });

const Route: Model<IRoute> =
  mongoose.models.Route || mongoose.model<IRoute>('Route', RouteSchema);

export default Route;
