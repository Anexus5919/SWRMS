/**
 * Anomaly detection engine for live tracking.
 *
 * Two checks run on every incoming GPS ping (or as a periodic sweep):
 *
 *  1. **Route deviation** — if the ping is more than
 *     TRACKING_DEVIATION_THRESHOLD_METERS from the snapped route polyline
 *     for two pings in a row, fire a `location_anomaly` VerificationLog.
 *     One isolated bad ping (GPS bounce) is ignored.
 *
 *  2. **Idle / stationary** — if the worker's last
 *     `idleSampleCount` pings span less than `idleSpanMetres`, they're
 *     stationary. Fires a `location_anomaly` log of severity 'info' so
 *     supervisors can decide whether it's a problem (lunch break, stuck
 *     in traffic, or actually skiving).
 *
 * Re-firing is rate-limited per (worker, type) pair to avoid log spam:
 * at most one alert of the same kind per 15 minutes per worker.
 */

import { GPSPing, VerificationLog, Route, User } from '../db/models';
import {
  distanceFromPointToPolyline,
  pointsSpanMetres,
} from '../geo/polyline';
import { decodePolyline } from '../routing/osrm';

const DEFAULT_DEVIATION_THRESHOLD_METRES = Number(
  process.env.TRACKING_DEVIATION_THRESHOLD_METERS ?? 120
);
const DEFAULT_IDLE_THRESHOLD_MINUTES = Number(
  process.env.TRACKING_IDLE_THRESHOLD_MINUTES ?? 10
);

const ALERT_COOLDOWN_MS = 15 * 60 * 1000; // 15 min

export interface AnomalyContext {
  userId: string;
  routeId: string;
  date: string;
  /** The newly-arrived ping that triggered evaluation. */
  pingLat: number;
  pingLng: number;
  pingRecordedAt: Date;
  /** If known, the cached snapped polyline as decoded array. */
  cachedPolyline?: Array<[number, number]>;
}

export interface AnomalyOutcome {
  distanceFromRouteMeters: number | null;
  isOffRoute: boolean;
  deviationAlertCreated: boolean;
  idleAlertCreated: boolean;
}

/**
 * Evaluate deviation + idle for a single ping. Should be called
 * **after** the ping has been persisted (we count it among recent pings).
 *
 * Returns a small summary the API can attach to its response so the
 * mobile client can show "You're off route — please return to your route."
 */
export async function evaluateAnomaly(ctx: AnomalyContext): Promise<AnomalyOutcome> {
  // --- 1. Resolve the snapped polyline (cache if caller has it) --------
  let polyline = ctx.cachedPolyline ?? null;
  if (!polyline) {
    const route = await Route.findById(ctx.routeId).select('routePolyline').lean();
    if (route?.routePolyline) {
      try {
        polyline = decodePolyline(route.routePolyline);
      } catch {
        polyline = null;
      }
    }
  }

  // No polyline = no deviation check possible. Idle check still works.
  let distance: number | null = null;
  let isOffRoute = false;
  if (polyline && polyline.length >= 2) {
    distance = distanceFromPointToPolyline(ctx.pingLat, ctx.pingLng, polyline);
    isOffRoute = distance > DEFAULT_DEVIATION_THRESHOLD_METRES;
  }

  // --- 2. Deviation alert: require TWO consecutive off-route pings -----
  let deviationAlertCreated = false;
  if (isOffRoute) {
    const previous = await GPSPing.findOne({
      userId: ctx.userId,
      date: ctx.date,
      recordedAt: { $lt: ctx.pingRecordedAt },
    })
      .sort({ recordedAt: -1 })
      .select('isOffRoute')
      .lean();

    if (previous?.isOffRoute) {
      // Spam-prevent: only fire if no deviation alert in the last 15 minutes
      const recent = await VerificationLog.findOne({
        type: 'location_anomaly',
        affectedUserId: ctx.userId,
        date: ctx.date,
        'details.kind': 'route_deviation',
        createdAt: { $gte: new Date(Date.now() - ALERT_COOLDOWN_MS) },
      }).select('_id').lean();

      if (!recent) {
        await VerificationLog.create({
          type: 'location_anomaly',
          severity: 'warning',
          routeId: ctx.routeId,
          date: ctx.date,
          affectedUserId: ctx.userId,
          details: {
            kind: 'route_deviation',
            distanceMeters: Math.round(distance ?? 0),
            thresholdMeters: DEFAULT_DEVIATION_THRESHOLD_METRES,
            coordinates: { lat: ctx.pingLat, lng: ctx.pingLng },
            message: `Worker is ${Math.round(
              distance ?? 0
            )}m off the assigned route polyline (threshold ${DEFAULT_DEVIATION_THRESHOLD_METRES}m). Two consecutive pings off-route.`,
          },
          resolution: { status: 'open' },
        });
        deviationAlertCreated = true;
      }
    }
  }

  // --- 3. Idle / stationary check --------------------------------------
  let idleAlertCreated = false;
  const idleWindowStart = new Date(
    ctx.pingRecordedAt.getTime() - DEFAULT_IDLE_THRESHOLD_MINUTES * 60_000
  );
  const recentPings = await GPSPing.find({
    userId: ctx.userId,
    date: ctx.date,
    recordedAt: { $gte: idleWindowStart, $lte: ctx.pingRecordedAt },
  })
    .select('coordinates recordedAt')
    .sort({ recordedAt: 1 })
    .lean();

  // Need at least 4 pings spanning the full window before idle is meaningful.
  // (At ~30s ping rate that's ~2 minutes of consecutive samples.)
  if (recentPings.length >= 4) {
    const windowSeconds = (recentPings[recentPings.length - 1].recordedAt.getTime() -
      recentPings[0].recordedAt.getTime()) / 1000;

    if (windowSeconds >= DEFAULT_IDLE_THRESHOLD_MINUTES * 60 * 0.8) {
      const span = pointsSpanMetres(
        recentPings.map((p) => ({ lat: p.coordinates.lat, lng: p.coordinates.lng }))
      );
      const IDLE_SPAN_METRES = 25; // less than ~25m of movement = stationary
      if (span < IDLE_SPAN_METRES) {
        const recent = await VerificationLog.findOne({
          type: 'location_anomaly',
          affectedUserId: ctx.userId,
          date: ctx.date,
          'details.kind': 'idle',
          createdAt: { $gte: new Date(Date.now() - ALERT_COOLDOWN_MS) },
        }).select('_id').lean();
        if (!recent) {
          await VerificationLog.create({
            type: 'location_anomaly',
            severity: 'info',
            routeId: ctx.routeId,
            date: ctx.date,
            affectedUserId: ctx.userId,
            details: {
              kind: 'idle',
              spanMeters: Math.round(span),
              windowMinutes: DEFAULT_IDLE_THRESHOLD_MINUTES,
              coordinates: { lat: ctx.pingLat, lng: ctx.pingLng },
              message: `Worker stationary for ${DEFAULT_IDLE_THRESHOLD_MINUTES} minutes (movement span ${Math.round(span)}m).`,
            },
            resolution: { status: 'open' },
          });
          idleAlertCreated = true;
        }
      }
    }
  }

  return {
    distanceFromRouteMeters: distance,
    isOffRoute,
    deviationAlertCreated,
    idleAlertCreated,
  };
}

/**
 * Helper used by the supervisor live dashboard: returns the most recent
 * ping per active worker on the given date. Uses MongoDB aggregation so
 * it's a single round trip even for hundreds of workers.
 */
export async function latestPingPerWorker(date: string) {
  return GPSPing.aggregate([
    { $match: { date } },
    { $sort: { recordedAt: -1 } },
    {
      $group: {
        _id: '$userId',
        lastPing: { $first: '$$ROOT' },
      },
    },
    {
      $lookup: {
        from: User.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        employeeId: '$user.employeeId',
        firstName: '$user.name.first',
        lastName: '$user.name.last',
        routeId: '$lastPing.routeId',
        coordinates: '$lastPing.coordinates',
        recordedAt: '$lastPing.recordedAt',
        isOffRoute: '$lastPing.isOffRoute',
        distanceFromRouteMeters: '$lastPing.distanceFromRouteMeters',
      },
    },
  ]);
}
