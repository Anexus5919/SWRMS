import { z } from 'zod';

// ── Coordinate validation ───────────────────────────────────────
const coordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0).optional(),
});

// ── Attendance ──────────────────────────────────────────────────
export const markAttendanceSchema = z.object({
  coordinates: coordinateSchema,
  deviceInfo: z.object({
    userAgent: z.string().max(500).optional(),
    platform: z.string().max(100).optional(),
  }).optional(),
  /** Android isFromMockProvider passthrough; we reject attendance if true. */
  mockLocation: z.boolean().optional(),
  /** Device-reported time so we can detect clock tampering. */
  clientTime: z.string().datetime().optional(),
});

export const syncAttendanceSchema = z.object({
  records: z.array(z.object({
    timestamp: z.string().datetime().or(z.string().min(1)),
    coordinates: coordinateSchema,
    deviceInfo: z.object({
      userAgent: z.string().optional(),
      platform: z.string().optional(),
    }).optional(),
  })).min(1).max(50),
});

// ── Photo size caps ─────────────────────────────────────────────
// Base64-encoded JPEG. ~1.4MB base64 ≈ ~1MB raw, generous for a 640x480 @70% JPEG.
// Profile photos are smaller (one-time enrolment) so cap tighter.
export const MAX_PHOTO_BASE64_LENGTH = 1_400_000;        // ~1MB raw
export const MAX_PROFILE_PHOTO_BASE64_LENGTH = 700_000;  // ~500KB raw

const photoBase64 = z
  .string()
  .min(100, 'Photo data appears empty')
  .max(MAX_PHOTO_BASE64_LENGTH, 'Photo exceeds 1MB size limit');

const profilePhotoBase64 = z
  .string()
  .min(100, 'Profile photo data appears empty')
  .max(MAX_PROFILE_PHOTO_BASE64_LENGTH, 'Profile photo exceeds 500KB size limit');

// ── Staff ───────────────────────────────────────────────────────
export const createStaffSchema = z.object({
  employeeId: z.string().min(3).max(30).regex(/^[A-Za-z0-9-]+$/, 'Only alphanumeric and hyphens'),
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  role: z.enum(['admin', 'supervisor', 'staff']),
  phone: z.string().min(10).max(15).regex(/^[0-9+\-\s]+$/, 'Invalid phone format'),
  password: z.string().min(6).max(100),
  assignedRouteId: z.string().optional().nullable(),
  profilePhoto: profilePhotoBase64.optional().nullable(),
  faceDescriptor: z.array(z.number()).length(128).optional().nullable(),
});

// Schema for POST /api/staff/face (face registration / re-enrolment)
export const registerFaceSchema = z.object({
  profilePhoto: profilePhotoBase64,
  faceDescriptor: z.array(z.number()).length(128),
});

export const updateStaffSchema = z.object({
  name: z.object({
    first: z.string().min(1).max(50).trim(),
    last: z.string().min(1).max(50).trim(),
  }).optional(),
  phone: z.string().min(10).max(15).regex(/^[0-9+\-\s]+$/).optional(),
  ward: z.string().max(50).optional(),
  assignedRouteId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

// ── Routes ──────────────────────────────────────────────────────
const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  label: z.string().max(120).optional(),
});

const waypointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  order: z.number().int().min(0),
});

// Encoded polyline string (Google polyline algorithm) returned by OSRM/Mapbox.
// Length cap is generous (50k chars covers very long routes).
const polylineSchema = z.string().max(50_000);

export const createRouteSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  code: z.string().min(2).max(20).regex(/^[A-Za-z0-9-]+$/),
  ward: z.string().max(50).optional(),
  startPoint: latLngSchema,
  endPoint: latLngSchema,
  waypoints: z.array(waypointSchema).max(50).optional(),
  estimatedLengthKm: z.number().positive().max(100),
  requiredStaff: z.number().int().min(1).max(20),
  geofenceRadius: z.number().min(50).max(1000).optional(),
  shiftStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  shiftEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  // Phase 3: optional pre-computed road-snapped polyline + meta
  routePolyline: polylineSchema.optional(),
  routePolylineSource: z.enum(['osrm', 'mapbox', 'graphhopper', 'manual']).optional(),
  routeDistanceKm: z.number().positive().max(200).optional(),
  routeDurationMinutes: z.number().positive().max(600).optional(),
});

// PUT /api/routes/[routeId] body schema. Whitelists writeable fields and
// adds `status` for activate/deactivate flows. All fields optional - admin
// can patch any subset.
export const updateRouteSchema = z.object({
  name: z.string().min(3).max(100).trim().optional(),
  code: z.string().min(2).max(20).regex(/^[A-Za-z0-9-]+$/).optional(),
  ward: z.string().max(50).optional(),
  startPoint: latLngSchema.optional(),
  endPoint: latLngSchema.optional(),
  waypoints: z.array(waypointSchema).max(50).optional(),
  estimatedLengthKm: z.number().positive().max(100).optional(),
  requiredStaff: z.number().int().min(1).max(20).optional(),
  geofenceRadius: z.number().min(50).max(1000).optional(),
  shiftStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  shiftEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  routePolyline: polylineSchema.optional(),
  routePolylineSource: z.enum(['osrm', 'mapbox', 'graphhopper', 'manual']).optional(),
  routeDistanceKm: z.number().positive().max(200).optional(),
  routeDurationMinutes: z.number().positive().max(600).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required',
});

// ── Reallocation ────────────────────────────────────────────────
export const createReallocationSchema = z.object({
  workerId: z.string().min(1),
  fromRouteId: z.string().min(1),
  toRouteId: z.string().min(1),
  reason: z.enum(['understaffed', 'route_completed', 'manual']).optional(),
  distanceBetweenRoutes: z.number().optional(),
  previousStaffingRatio: z.number().optional(),
  newStaffingRatio: z.number().optional(),
}).refine(data => data.fromRouteId !== data.toRouteId, {
  message: 'Source and destination routes must be different',
});

// ── GeoTagged Photo ─────────────────────────────────────────────
export const uploadPhotoSchema = z.object({
  type: z.enum(['shift_start', 'checkpoint', 'shift_end']),
  photo: photoBase64,
  coordinates: coordinateSchema,
  faceDescriptor: z.array(z.number()).length(128).nullable().optional(),
  facesCount: z.number().int().min(0).optional(),
  faceDetected: z.boolean().optional(),
  deviceInfo: z.object({
    userAgent: z.string().optional(),
    platform: z.string().optional(),
  }).optional(),
});

// ── Verification Log Resolution ─────────────────────────────────
export const resolveLogSchema = z.object({
  status: z.enum(['acknowledged', 'resolved', 'dismissed']),
  notes: z.string().max(500).optional(),
});

// ── Photo Manual Review ─────────────────────────────────────────
export const reviewPhotoSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  notes: z.string().max(500).optional(),
});
