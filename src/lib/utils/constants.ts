// Application-wide constants

export const GEOFENCE_RADIUS_METERS = 200;
export const EARTH_RADIUS_METERS = 6_371_000;

export const SHIFT_START = '06:00';
export const SHIFT_END = '14:00';
export const ATTENDANCE_WINDOW_MINUTES = 30;

export const STAFFING_THRESHOLDS = {
  CRITICAL: 0.5,   // RED - fewer than half showed up
  MARGINAL: 0.75,  // AMBER - operational but strained
  ADEQUATE: 1.0,   // GREEN - fully staffed or above
} as const;

export const FACE_VERIFICATION = {
  HIGH_CONFIDENCE: 0.5,    // Auto-verified
  MEDIUM_CONFIDENCE: 0.65, // Verified but flagged for spot-check
  LOW_CONFIDENCE: 0.8,     // Mandatory manual review
  // > 0.8 = No match, rejected
} as const;

export const PHOTO_TYPES = {
  SHIFT_START: 'shift_start',
  CHECKPOINT: 'checkpoint',
  SHIFT_END: 'shift_end',
} as const;

export const GPS_CONFIG = {
  MAX_ATTEMPTS: 3,
  RETRY_INTERVAL_MS: 2000,
  MAX_ACCEPTABLE_ACCURACY: 50, // meters
} as const;

export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  STAFF: 'staff',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ROUTE_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  STALLED: 'stalled',
} as const;

export const ATTENDANCE_STATUS = {
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  PENDING_SYNC: 'pending_sync',
} as const;

export const WARD = 'Chembur';

// Chembur center coordinates (for default map view)
export const CHEMBUR_CENTER = {
  lat: 19.0522,
  lng: 72.8994,
} as const;
