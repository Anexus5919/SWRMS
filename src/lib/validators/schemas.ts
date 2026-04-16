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
    userAgent: z.string().optional(),
    platform: z.string().optional(),
  }).optional(),
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

// ── Staff ───────────────────────────────────────────────────────
export const createStaffSchema = z.object({
  employeeId: z.string().min(3).max(30).regex(/^[A-Za-z0-9-]+$/, 'Only alphanumeric and hyphens'),
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  role: z.enum(['admin', 'supervisor', 'staff']),
  phone: z.string().min(10).max(15).regex(/^[0-9+\-\s]+$/, 'Invalid phone format'),
  password: z.string().min(6).max(100),
  assignedRouteId: z.string().optional().nullable(),
  profilePhoto: z.string().optional().nullable(),
  faceDescriptor: z.array(z.number()).length(128).optional().nullable(),
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
export const createRouteSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  code: z.string().min(2).max(20).regex(/^[A-Za-z0-9-]+$/),
  ward: z.string().max(50).optional(),
  startPoint: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    label: z.string().optional(),
  }),
  endPoint: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    label: z.string().optional(),
  }),
  waypoints: z.array(z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    order: z.number().int().min(0),
  })).optional(),
  estimatedLengthKm: z.number().positive().max(100),
  requiredStaff: z.number().int().min(1).max(20),
  geofenceRadius: z.number().min(50).max(1000).optional(),
  shiftStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  shiftEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
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
  photo: z.string().min(100), // base64 string
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
