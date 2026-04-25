import { NextResponse } from 'next/server';

/**
 * GET /api/push/vapid-key — returns the VAPID public key.
 *
 * The browser needs this to call `pushManager.subscribe({ applicationServerKey })`.
 * The key is intentionally public (it's also usable as a static `NEXT_PUBLIC_*`
 * env var in the client bundle); routing it through this endpoint just keeps
 * the consumption pattern symmetrical with the rest of /api/push.
 */
export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VAPID_NOT_CONFIGURED',
          message:
            'Push notifications are not configured on the server. Generate VAPID keys with `npm run vapid:generate` and set them in .env.local.',
        },
      },
      { status: 503 }
    );
  }
  return NextResponse.json({ success: true, data: { publicKey } });
}
