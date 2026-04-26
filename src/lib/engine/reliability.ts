/**
 * Worker reliability scoring engine.
 *
 * Aggregates a per-worker score from existing operational signals
 * (no extra logging needed):
 *
 *   - Attendance.status                       (verified / rejected / missing)
 *   - Attendance.checkInTime vs Route.shiftStart  (lateness)
 *   - Attendance.mockLocation                 (mock-GPS attempts)
 *   - VerificationLog kind=route_deviation    (off-route alerts)
 *   - VerificationLog kind=idle               (stationary alerts)
 *   - VerificationLog kind=mock_location      (live mock-GPS during shift)
 *   - VerificationLog type=face_mismatch / no_face_detected
 *   - Unavailability                          (declared sick/personal - neutral)
 *
 * Score (0–100) is the **mean of per-day scores** over the window.
 * A day on which the worker declared unavailability is excluded from
 * the average (sick leave is neutral, not a penalty). A day on which
 * the worker had no assigned route at all is also excluded.
 *
 * The breakdown returns raw counts so the UI can show "why" alongside
 * the number - a 72/100 with 3 missed shifts reads very differently
 * from a 72/100 with 8 idle alerts.
 *
 * This is a pure read-only aggregation. It does no writes and is
 * cheap enough to run on demand for one worker (~5 queries). For
 * a workforce-wide table we batch queries by date range.
 */

import { Types } from 'mongoose';
import { Attendance, VerificationLog, Unavailability, User, Route } from '../db/models';

// ---------- Tunables ----------
// Per-day scoring rubric. Each event subtracts from a 100-point baseline.
// Caps prevent a single bad day from also dragging the next day's score.
const PENALTY = {
  missedShift: 60,        // had route, no attendance, no unavailability
  rejectedAttendance: 20, // geofence rejection - deliberate or careless
  lateArrival: 5,         // > LATE_GRACE_MINUTES after shiftStart
  routeDeviation: 5,      // per alert (capped)
  routeDeviationCap: 20,
  idle: 2,                // per alert (capped)
  idleCap: 10,
  mockLocation: 50,       // either at attendance or live-tracking
  faceMismatch: 10,       // per face_mismatch / no_face_detected log (capped)
  faceMismatchCap: 20,
} as const;

const LATE_GRACE_MINUTES = 15;

export type ReliabilityRating = 'excellent' | 'good' | 'fair' | 'poor';

export interface ReliabilityDay {
  date: string;
  scheduled: boolean;     // had route assigned & not on unavailability
  attended: boolean;
  score: number;          // 0..100 for that day, or null when not scheduled
  events: {
    missed: boolean;
    rejected: boolean;
    late: boolean;
    routeDeviationAlerts: number;
    idleAlerts: number;
    mockLocationFlags: number;
    faceMismatches: number;
    unavailability: string | null;
  };
}

export interface ReliabilityBreakdown {
  daysAnalyzed: number;
  daysScheduled: number;
  daysAttended: number;
  daysMissed: number;
  lateArrivals: number;
  rejectedAttendance: number;
  routeDeviationAlerts: number;
  idleAlerts: number;
  mockLocationFlags: number;
  faceMismatches: number;
  unavailabilityDays: number;
}

export interface ReliabilityResult {
  userId: string;
  score: number;          // 0..100, rounded
  rating: ReliabilityRating;
  breakdown: ReliabilityBreakdown;
  daily: ReliabilityDay[];
  windowStart: string;
  windowEnd: string;
}

function rate(score: number): ReliabilityRating {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
}

/** Inclusive YYYY-MM-DD list between two dates (IST naive). */
function dateRange(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  const start = new Date(startISO + 'T00:00:00.000Z');
  const end = new Date(endISO + 'T00:00:00.000Z');
  for (let d = start.getTime(); d <= end.getTime(); d += 86_400_000) {
    out.push(new Date(d).toISOString().split('T')[0]);
  }
  return out;
}

/**
 * Was the check-in late by more than LATE_GRACE_MINUTES vs the route's shiftStart?
 * checkInTime is a real Date, shiftStart is "HH:MM" IST.
 */
function isLate(checkInTime: Date, shiftStart: string): boolean {
  const [h, m] = shiftStart.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return false;
  // Convert checkInTime to IST minutes-since-midnight
  const ist = new Date(checkInTime.getTime() + 5.5 * 60 * 60 * 1000);
  const checkinMins = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  const shiftMins = h * 60 + m;
  return checkinMins - shiftMins > LATE_GRACE_MINUTES;
}

function clampDayScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

/**
 * Compute reliability for ONE worker over [windowStart, windowEnd] inclusive.
 * Returns a per-day series + roll-up.
 */
export async function computeReliabilityForUser(
  userId: string,
  windowStart: string,
  windowEnd: string
): Promise<ReliabilityResult> {
  const userObjectId = new Types.ObjectId(userId);
  const dates = dateRange(windowStart, windowEnd);

  const [user, attendanceRecords, verificationLogs, unavailabilityRecords] = await Promise.all([
    User.findById(userObjectId).select('assignedRouteId').lean(),
    Attendance.find({
      userId: userObjectId,
      date: { $gte: windowStart, $lte: windowEnd },
    })
      .select('date status checkInTime mockLocation routeId')
      .lean(),
    VerificationLog.find({
      affectedUserId: userObjectId,
      date: { $gte: windowStart, $lte: windowEnd },
    })
      .select('date type details.kind severity')
      .lean(),
    Unavailability.find({
      userId: userObjectId,
      date: { $gte: windowStart, $lte: windowEnd },
    })
      .select('date reason')
      .lean(),
  ]);

  // Pre-fetch shiftStart for any route the worker has used in the window.
  const routeIds = new Set<string>();
  if (user?.assignedRouteId) routeIds.add(user.assignedRouteId.toString());
  for (const a of attendanceRecords) {
    if (a.routeId) routeIds.add(a.routeId.toString());
  }
  const routes = routeIds.size
    ? await Route.find({ _id: { $in: Array.from(routeIds).map((id) => new Types.ObjectId(id)) } })
        .select('shiftStart')
        .lean()
    : [];
  const shiftStartByRoute = new Map(routes.map((r) => [r._id.toString(), r.shiftStart]));

  // Index events by date for O(1) lookup.
  const attByDate = new Map(attendanceRecords.map((a) => [a.date, a]));
  const unavByDate = new Map(unavailabilityRecords.map((u) => [u.date, u]));
  const logsByDate = new Map<string, typeof verificationLogs>();
  for (const log of verificationLogs) {
    const arr = logsByDate.get(log.date) ?? [];
    arr.push(log);
    logsByDate.set(log.date, arr);
  }

  // ---------- Build per-day results ----------
  const daily: ReliabilityDay[] = [];
  const breakdown: ReliabilityBreakdown = {
    daysAnalyzed: dates.length,
    daysScheduled: 0,
    daysAttended: 0,
    daysMissed: 0,
    lateArrivals: 0,
    rejectedAttendance: 0,
    routeDeviationAlerts: 0,
    idleAlerts: 0,
    mockLocationFlags: 0,
    faceMismatches: 0,
    unavailabilityDays: 0,
  };

  for (const date of dates) {
    const att = attByDate.get(date);
    const unav = unavByDate.get(date);
    const dayLogs = logsByDate.get(date) ?? [];

    const routeDeviationAlerts = dayLogs.filter(
      (l) => l.type === 'location_anomaly' && l.details?.kind === 'route_deviation'
    ).length;
    const idleAlerts = dayLogs.filter(
      (l) => l.type === 'location_anomaly' && l.details?.kind === 'idle'
    ).length;
    const mockLogFlags = dayLogs.filter(
      (l) => l.type === 'location_anomaly' && l.details?.kind === 'mock_location'
    ).length;
    const faceMismatches = dayLogs.filter(
      (l) => l.type === 'face_mismatch' || l.type === 'no_face_detected'
    ).length;

    // Worker is "scheduled" for the day if they had a route AND no
    // declared unavailability. Without an assigned route there's no
    // expected presence - score is N/A for that day.
    const hadRoute = !!user?.assignedRouteId || !!att?.routeId;
    const declaredUnavailable = !!unav;
    const scheduled = hadRoute && !declaredUnavailable;
    const attended = att?.status === 'verified' || att?.status === 'pending_sync';
    const rejected = att?.status === 'rejected';
    const mockAttempt = !!att?.mockLocation;

    const shiftStart = att?.routeId
      ? shiftStartByRoute.get(att.routeId.toString())
      : user?.assignedRouteId
        ? shiftStartByRoute.get(user.assignedRouteId.toString())
        : undefined;
    const late = !!(attended && shiftStart && att?.checkInTime && isLate(att.checkInTime, shiftStart));

    if (declaredUnavailable) breakdown.unavailabilityDays += 1;
    if (scheduled) breakdown.daysScheduled += 1;
    if (attended) breakdown.daysAttended += 1;
    if (scheduled && !attended) breakdown.daysMissed += 1;
    if (late) breakdown.lateArrivals += 1;
    if (rejected) breakdown.rejectedAttendance += 1;
    breakdown.routeDeviationAlerts += routeDeviationAlerts;
    breakdown.idleAlerts += idleAlerts;
    breakdown.mockLocationFlags += mockLogFlags + (mockAttempt ? 1 : 0);
    breakdown.faceMismatches += faceMismatches;

    let dayScore = 100;
    if (scheduled) {
      if (!attended) dayScore -= PENALTY.missedShift;
      if (rejected) dayScore -= PENALTY.rejectedAttendance;
      if (late) dayScore -= PENALTY.lateArrival;
      dayScore -= Math.min(routeDeviationAlerts * PENALTY.routeDeviation, PENALTY.routeDeviationCap);
      dayScore -= Math.min(idleAlerts * PENALTY.idle, PENALTY.idleCap);
      dayScore -= (mockLogFlags + (mockAttempt ? 1 : 0)) * PENALTY.mockLocation;
      dayScore -= Math.min(faceMismatches * PENALTY.faceMismatch, PENALTY.faceMismatchCap);
    }

    daily.push({
      date,
      scheduled,
      attended,
      score: scheduled ? clampDayScore(dayScore) : 100, // N/A days don't penalise
      events: {
        missed: scheduled && !attended,
        rejected,
        late,
        routeDeviationAlerts,
        idleAlerts,
        mockLocationFlags: mockLogFlags + (mockAttempt ? 1 : 0),
        faceMismatches,
        unavailability: unav?.reason ?? null,
      },
    });
  }

  // Average over **scheduled** days only. If a worker was on leave the
  // entire window we score them 100 (neutral) rather than 0.
  const scoredDays = daily.filter((d) => d.scheduled);
  const score = scoredDays.length
    ? Math.round(scoredDays.reduce((s, d) => s + d.score, 0) / scoredDays.length)
    : 100;

  return {
    userId,
    score,
    rating: rate(score),
    breakdown,
    daily,
    windowStart,
    windowEnd,
  };
}

/**
 * Workforce-wide reliability table. Runs the per-user computation in
 * parallel batches to avoid Promise.all-ing 200+ MongoDB queries at once.
 */
export async function computeReliabilityForCohort(
  userIds: string[],
  windowStart: string,
  windowEnd: string,
  batchSize = 20
): Promise<ReliabilityResult[]> {
  const results: ReliabilityResult[] = [];
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((id) => computeReliabilityForUser(id, windowStart, windowEnd))
    );
    results.push(...batchResults);
  }
  return results;
}

/** Convert "days=N" query param to a YYYY-MM-DD window ending today (IST). */
export function windowFromDays(days: number, todayIST: string): { from: string; to: string } {
  const to = todayIST;
  const start = new Date(todayIST + 'T00:00:00.000Z');
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { from: start.toISOString().split('T')[0], to };
}
