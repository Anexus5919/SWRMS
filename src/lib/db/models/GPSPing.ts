import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * GPSPing - one row per location update from a staff device during shift.
 *
 * Pings are written every ~30s by the staff PWA after the worker presses
 * "Start Shift" and stop when they press "End Shift" (or when shift_end
 * passes). Pings power three things:
 *   1. Route deviation alerts - distance from snapped polyline > threshold
 *   2. Idle / stationary detection - worker hasn't moved for N minutes
 *   3. GPS replay (Phase 7) - supervisor scrubs through a worker's day
 *
 * Privacy: pings are only collected during an active shift the worker
 * explicitly started. The staff PWA shows a "Tracking: ON" indicator
 * while pings are flowing.
 */

export interface IGPSPing extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  date: string;                            // YYYY-MM-DD (IST)
  recordedAt: Date;                        // server-side receipt time
  clientTime: Date | null;                 // device-reported timestamp (may be skewed)
  coordinates: {
    lat: number;
    lng: number;
    accuracy?: number | null;              // metres, from Geolocation API
    speedMps?: number | null;              // metres/sec, optional
    heading?: number | null;               // degrees from north, optional
  };
  /** Pre-computed distance from the route polyline at write time (metres). */
  distanceFromRouteMeters?: number | null;
  /** Pre-computed flag: was this ping outside the deviation threshold? */
  isOffRoute?: boolean;
  /** Was the device reporting mock-location (Android isFromMockProvider)? */
  mockLocation?: boolean;
}

const GPSPingSchema = new Schema<IGPSPing>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    routeId: { type: Schema.Types.ObjectId, ref: 'Route', required: true, index: true },
    date: { type: String, required: true, index: true },
    recordedAt: { type: Date, required: true, default: () => new Date() },
    clientTime: { type: Date, default: null },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      accuracy: { type: Number, default: null },
      speedMps: { type: Number, default: null },
      heading: { type: Number, default: null },
    },
    distanceFromRouteMeters: { type: Number, default: null },
    isOffRoute: { type: Boolean, default: false },
    mockLocation: { type: Boolean, default: false },
  },
  { timestamps: false }
);

// Hot path: "all of this worker's pings today, in order"
GPSPingSchema.index({ userId: 1, date: 1, recordedAt: 1 });
// Hot path: "all pings on this route in the last N minutes" (live dashboard)
GPSPingSchema.index({ routeId: 1, recordedAt: -1 });
// Off-route alerting / stale ping cleanup
GPSPingSchema.index({ isOffRoute: 1, recordedAt: -1 });

const GPSPing: Model<IGPSPing> =
  mongoose.models.GPSPing || mongoose.model<IGPSPing>('GPSPing', GPSPingSchema);

export default GPSPing;
