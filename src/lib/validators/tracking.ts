import { z } from 'zod';

/**
 * Schema for POST /api/tracking/ping body. Accepts a single GPS sample
 * from a staff PWA. Bounds match those in the GPSPing mongoose schema.
 */
export const trackingPingSchema = z.object({
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracy: z.number().min(0).max(10_000).optional(),
    speedMps: z.number().min(0).max(150).optional(),  // 150 m/s = 540 km/h, sanity cap
    heading: z.number().min(0).max(360).optional(),
  }),
  /** Device-reported ISO timestamp; server will compare to its own clock for drift. */
  clientTime: z.string().datetime().optional(),
  /** Android isFromMockProvider passthrough. We trust the client to flag itself. */
  mockLocation: z.boolean().optional(),
  /** Optional: client-side user agent / platform string for debug. */
  deviceInfo: z
    .object({
      userAgent: z.string().max(500).optional(),
      platform: z.string().max(100).optional(),
    })
    .optional(),
});

export type TrackingPingBody = z.infer<typeof trackingPingSchema>;
