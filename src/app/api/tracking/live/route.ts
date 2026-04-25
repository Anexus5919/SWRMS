import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { requireRole } from '@/lib/auth/middleware';
import { latestPingPerWorker } from '@/lib/engine/anomaly';
import { todayIST } from '@/lib/utils/timezone';

/**
 * GET /api/tracking/live - Latest GPS position per active worker for today.
 *
 * Used by the supervisor dashboard map to render live worker pins
 * alongside the route polylines. One row per worker, picked from their
 * most recent GPSPing today via an aggregation pipeline.
 */
export async function GET() {
  const { error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  await connectDB();
  const today = todayIST();

  const positions = await latestPingPerWorker(today);

  // Filter pings older than 5 minutes to avoid showing stale dots.
  // Worker phone may have lost connectivity; better to hide than mislead.
  const STALE_MS = 5 * 60 * 1000;
  const cutoff = Date.now() - STALE_MS;
  const fresh = positions.filter((p: { recordedAt: Date }) => p.recordedAt.getTime() >= cutoff);

  return NextResponse.json({
    success: true,
    data: { positions: fresh, staleAfterMs: STALE_MS, asOf: new Date().toISOString() },
  });
}
