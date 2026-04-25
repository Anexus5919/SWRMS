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
  /** Encoded polyline (Google polyline algorithm, precision 5) snapped to roads. */
  routePolyline?: string | null;
  /** Source of the polyline so we can re-snap or trust accordingly. */
  routePolylineSource?: 'osrm' | 'mapbox' | 'graphhopper' | 'manual' | null;
  /** Distance returned by the routing engine. May differ from estimatedLengthKm. */
  routeDistanceKm?: number | null;
  /** Driving duration estimate in minutes. */
  routeDurationMinutes?: number | null;
  /** When the polyline was last computed; null until first snap. */
  routePolylineUpdatedAt?: Date | null;
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
  routePolyline: {
    type: String,
    default: null,
  },
  routePolylineSource: {
    type: String,
    enum: ['osrm', 'mapbox', 'graphhopper', 'manual', null],
    default: null,
  },
  routeDistanceKm: {
    type: Number,
    default: null,
  },
  routeDurationMinutes: {
    type: Number,
    default: null,
  },
  routePolylineUpdatedAt: {
    type: Date,
    default: null,
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
