import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { requireRole } from '@/lib/auth/middleware';
import { latestPingPerWorker } from '@/lib/engine/anomaly';
import { todayIST } from '@/lib/utils/timezone';

/**
 * GET /api/tracking/stream — Server-Sent Events feed of live worker positions.
 *
 * Why SSE rather than Socket.IO? Next 16's App Router runs API routes as
 * serverless-style request handlers; there is no shared event loop into
 * which a Socket.IO server can attach. Wiring Socket.IO would require a
 * custom `server.ts`, which breaks the default `next start` and the
 * Turbopack dev experience. SSE is a one-way stream — perfect for "push
 * me the latest data every few seconds" — and works out of the box.
 *
 * The handler keeps the connection open and emits a JSON payload every
 * `INTERVAL_MS` (5s by default). Clients reconnect automatically with
 * `EventSource`, so a brief disconnect (e.g. mobile network blip) is
 * transparent. Stale pings (>5 min old) are filtered out at the source.
 *
 * Auth: supervisor or admin only.
 */

const INTERVAL_MS = 5_000;
const STALE_MS = 5 * 60 * 1000;
// Hard ceiling per connection — clients reconnect automatically. This
// prevents a leaked tab from holding a connection open indefinitely.
const MAX_DURATION_MS = 30 * 60 * 1000;

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  await connectDB();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const startedAt = Date.now();
      let cancelled = false;

      const send = (event: string, data: unknown) => {
        if (cancelled) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          cancelled = true;
        }
      };

      // Initial payload immediately so the client doesn't have to wait
      // for the first interval tick to populate.
      const pushSnapshot = async () => {
        try {
          const today = todayIST();
          const positions = await latestPingPerWorker(today);
          const cutoff = Date.now() - STALE_MS;
          const fresh = positions.filter(
            (p: { recordedAt: Date }) => p.recordedAt.getTime() >= cutoff
          );
          send('positions', {
            positions: fresh,
            staleAfterMs: STALE_MS,
            asOf: new Date().toISOString(),
          });
        } catch (e) {
          send('error', { message: e instanceof Error ? e.message : 'snapshot_failed' });
        }
      };

      await pushSnapshot();

      const tick = setInterval(async () => {
        if (cancelled) return;
        if (Date.now() - startedAt > MAX_DURATION_MS) {
          send('end', { reason: 'max_duration' });
          cleanup();
          return;
        }
        await pushSnapshot();
      }, INTERVAL_MS);

      const cleanup = () => {
        cancelled = true;
        clearInterval(tick);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      // Detect client disconnect (browser closes the EventSource).
      req.signal.addEventListener('abort', cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Disable proxy buffering so events flush immediately.
      'X-Accel-Buffering': 'no',
    },
  });
}
