import { NextRequest, NextResponse } from 'next/server';

/**
 * Lightweight in-memory token-bucket rate limiter.
 *
 * **Production note:** state is per-process. On a single Node instance
 * (e.g. one VM, dev mode, or a fixed-pod deployment) this is fine. On a
 * serverless or multi-replica deploy, swap the `buckets` Map for an
 * external store (Redis / Upstash / Vercel KV) — the public API is
 * already designed to make that swap mechanical.
 *
 * The limiter is deliberately *advisory* on auth: we still call
 * `requireRole(...)` first so an unauthenticated attacker can't burn a
 * legit user's quota by spamming with their userId in the URL.
 */

interface Bucket {
  count: number;
  /** Unix ms at which the window resets and `count` is cleared. */
  resetAt: number;
}

// Single Map of `key → bucket`. Cleared periodically when it grows large
// enough to warrant a sweep. For the prototype this is comfortably under
// a few thousand entries (one per active user × endpoint).
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS_BEFORE_PRUNE = 5000;

function prune(now: number) {
  if (buckets.size < MAX_BUCKETS_BEFORE_PRUNE) return;
  for (const [k, b] of buckets) {
    if (b.resetAt < now) buckets.delete(k);
  }
}

export interface LimitResult {
  ok: boolean;
  /** Remaining tokens in the current window. */
  remaining: number;
  /** Unix ms at which the window resets. */
  resetAt: number;
  /** Seconds the client should wait before retrying (0 when ok=true). */
  retryAfterSec: number;
  /** Maximum tokens for this window — handy for response headers. */
  limit: number;
}

/**
 * Increment-and-check. Returns whether the action is allowed and the
 * accounting numbers needed for `RateLimit-*` response headers.
 */
export function checkLimit(key: string, max: number, windowMs: number): LimitResult {
  const now = Date.now();
  prune(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const fresh: Bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, fresh);
    return { ok: true, remaining: max - 1, resetAt: fresh.resetAt, retryAfterSec: 0, limit: max };
  }

  if (existing.count >= max) {
    return {
      ok: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      limit: max,
    };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: max - existing.count,
    resetAt: existing.resetAt,
    retryAfterSec: 0,
    limit: max,
  };
}

/**
 * Build the standard 429 response with Retry-After + RateLimit-* headers.
 */
export function rateLimitResponse(result: LimitResult): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Too many requests. Try again in ${result.retryAfterSec}s.`,
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSec),
        'RateLimit-Limit': String(result.limit),
        'RateLimit-Remaining': '0',
        'RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
      },
    }
  );
}

/**
 * Best-effort IP extraction for IP-based rate limits.
 * Honours `x-forwarded-for` (set by upstream proxies); falls back to a
 * synthetic `unknown` so the limiter always has a key.
 */
export function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Per-endpoint defaults. Pulled out so the policy is reviewable in one
 * place rather than scattered across handlers.
 */
export const LIMITS = {
  /** Attendance check-in — one per day in practice; allow ~10 retries
   *  in 5 min to absorb GPS/network retries without blocking legit work. */
  attendance: { max: 10, windowMs: 5 * 60 * 1000 },

  /** Photo uploads — shift_start, checkpoints, shift_end. Cap at 30/hr
   *  so a script can't push thousands of base64 blobs through. */
  photos: { max: 30, windowMs: 60 * 60 * 1000 },

  /** GPS ping — client posts every ~30 s = 120/hr. Allow 240/hr to
   *  cover transient retries without being permissive about scripted
   *  flooding. */
  trackingPing: { max: 240, windowMs: 60 * 60 * 1000 },

  /** Unavailability declaration — 1 expected per day. 5/day allows for
   *  cancel-and-redeclare without ever opening a spam vector. */
  unavailability: { max: 5, windowMs: 24 * 60 * 60 * 1000 },

  /** Push subscribe — bursty on first install, then quiet. */
  pushSubscribe: { max: 10, windowMs: 60 * 60 * 1000 },
} as const;
