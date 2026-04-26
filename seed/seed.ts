/**
 * Database Seeder for SWRMS
 * Run with: npx tsx seed/seed.ts
 *
 * Seeds 10 Chembur ward routes, 30 staff, 3 supervisors, 1 admin
 * with realistic Mumbai coordinates.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load .env.local for standalone script execution
config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not found. Make sure .env.local exists.');
  process.exit(1);
}

// ── Schemas (inline to avoid path alias issues in standalone script) ──

const UserSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  name: { first: { type: String, required: true }, last: { type: String, required: true } },
  role: { type: String, enum: ['admin', 'supervisor', 'staff'], required: true },
  ward: { type: String, default: 'Chembur' },
  phone: { type: String, required: true },
  passwordHash: { type: String, required: true },
  assignedRouteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', default: null },
  isActive: { type: Boolean, default: true },
  profilePhoto: { type: String, default: null },
  faceDescriptor: { type: [Number], default: null },
  faceRegisteredAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

const RouteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true, required: true },
  ward: { type: String, default: 'Chembur' },
  startPoint: { lat: { type: Number, required: true }, lng: { type: Number, required: true }, label: String },
  endPoint: { lat: { type: Number, required: true }, lng: { type: Number, required: true }, label: String },
  waypoints: [{ lat: Number, lng: Number, order: Number }],
  estimatedLengthKm: { type: Number, required: true },
  requiredStaff: { type: Number, required: true, min: 1 },
  geofenceRadius: { type: Number, default: 200 },
  shiftStart: { type: String, default: '06:00' },
  shiftEnd: { type: String, default: '14:00' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  routePolyline: { type: String, default: null },
  routePolylineSource: { type: String, enum: ['osrm', 'mapbox', 'graphhopper', 'manual', null], default: null },
  routeDistanceKm: { type: Number, default: null },
  routeDurationMinutes: { type: Number, default: null },
  routePolylineUpdatedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  date: { type: String, required: true },
  checkInTime: { type: Date, required: true },
  coordinates: { lat: Number, lng: Number, accuracy: Number },
  distanceFromRoute: { type: Number, required: true },
  status: { type: String, enum: ['verified', 'rejected'], required: true },
  rejectionReason: String,
  attempts: { type: Number, default: 1 },
  deviceInfo: { userAgent: String, platform: String },
  isOfflineSync: { type: Boolean, default: false },
}, { timestamps: true });
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

const RouteProgressSchema = new mongoose.Schema({
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['not_started', 'in_progress', 'completed', 'stalled'], default: 'not_started' },
  completionPercentage: { type: Number, default: 0 },
  staffingSnapshot: { required: Number, present: Number, ratio: Number },
  updates: [{ time: Date, percentage: Number, updatedBy: mongoose.Schema.Types.ObjectId, note: String }],
}, { timestamps: true });
RouteProgressSchema.index({ routeId: 1, date: 1 }, { unique: true });

const VerificationLogSchema = new mongoose.Schema({
  type: { type: String, enum: ['missing_photo', 'face_mismatch', 'no_face_detected', 'headcount_mismatch', 'location_anomaly', 'manual_override'], required: true },
  severity: { type: String, enum: ['info', 'warning', 'critical'], required: true },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  date: { type: String, required: true },
  affectedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  geoPhotoId: { type: mongoose.Schema.Types.ObjectId, ref: 'GeoPhoto', default: null },
  details: { message: String, expectedCount: Number, actualCount: Number, faceDistance: Number, coordinates: { lat: Number, lng: Number } },
  resolution: {
    status: { type: String, enum: ['open', 'acknowledged', 'resolved', 'dismissed'], default: 'open' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
    notes: { type: String, default: null },
  },
}, { timestamps: true });

const UnavailabilitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  reason: { type: String, enum: ['sick', 'personal', 'transport', 'other'], required: true },
  notes: String,
  declaredAt: { type: Date, default: Date.now },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', default: null },
});
UnavailabilitySchema.index({ userId: 1, date: 1 }, { unique: true });

const GPSPingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true, index: true },
  date: { type: String, required: true, index: true },
  recordedAt: { type: Date, required: true, default: () => new Date() },
  clientTime: { type: Date, default: null },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracy: { type: Number, default: null },
    speedMps: { type: Number, default: null },
    heading: { type: Number, default: null },
  },
  distanceFromRouteMeters: { type: Number, default: null },
  isOffRoute: { type: Boolean, default: false },
  mockLocation: { type: Boolean, default: false },
}, { timestamps: false });
GPSPingSchema.index({ userId: 1, date: 1, recordedAt: 1 });
GPSPingSchema.index({ routeId: 1, recordedAt: -1 });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Route = mongoose.models.Route || mongoose.model('Route', RouteSchema);
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
const RouteProgress = mongoose.models.RouteProgress || mongoose.model('RouteProgress', RouteProgressSchema);
const VerificationLog = mongoose.models.VerificationLog || mongoose.model('VerificationLog', VerificationLogSchema);
const Unavailability = mongoose.models.Unavailability || mongoose.model('Unavailability', UnavailabilitySchema);
const GPSPing = mongoose.models.GPSPing || mongoose.model('GPSPing', GPSPingSchema);

// ── Chembur Ward Routes (realistic Mumbai coordinates) ──

const routes = [
  {
    name: 'Chembur Naka to RCF Colony',
    code: 'CHB-R01',
    startPoint: { lat: 19.0622, lng: 72.8979, label: 'Chembur Naka Junction' },
    endPoint: { lat: 19.0520, lng: 72.8890, label: 'RCF Colony Gate' },
    estimatedLengthKm: 3.2,
    requiredStaff: 4,
  },
  {
    name: 'Tilak Nagar to Chembur Station',
    code: 'CHB-R02',
    startPoint: { lat: 19.0555, lng: 72.9045, label: 'Tilak Nagar Market' },
    endPoint: { lat: 19.0532, lng: 72.8972, label: 'Chembur Railway Station' },
    estimatedLengthKm: 2.1,
    requiredStaff: 3,
  },
  {
    name: 'Sindhi Society to Diamond Garden',
    code: 'CHB-R03',
    startPoint: { lat: 19.0480, lng: 72.8988, label: 'Sindhi Society Circle' },
    endPoint: { lat: 19.0440, lng: 72.8930, label: 'Diamond Garden' },
    estimatedLengthKm: 1.8,
    requiredStaff: 3,
  },
  {
    name: 'Basant Park to Ambedkar Garden',
    code: 'CHB-R04',
    startPoint: { lat: 19.0600, lng: 72.9010, label: 'Basant Park Main Road' },
    endPoint: { lat: 19.0570, lng: 72.8960, label: 'Ambedkar Garden' },
    estimatedLengthKm: 2.5,
    requiredStaff: 3,
  },
  {
    name: 'Sion-Trombay Road (North)',
    code: 'CHB-R05',
    startPoint: { lat: 19.0660, lng: 72.8950, label: 'Sion-Trombay Road Start' },
    endPoint: { lat: 19.0590, lng: 72.8900, label: 'Trombay Junction' },
    estimatedLengthKm: 4.0,
    requiredStaff: 5,
  },
  {
    name: 'Chembur Camp to Mahul Road',
    code: 'CHB-R06',
    startPoint: { lat: 19.0500, lng: 72.9030, label: 'Chembur Camp' },
    endPoint: { lat: 19.0420, lng: 72.9080, label: 'Mahul Road End' },
    estimatedLengthKm: 3.5,
    requiredStaff: 4,
  },
  {
    name: 'Govandi Station to Shivaji Nagar',
    code: 'CHB-R07',
    startPoint: { lat: 19.0580, lng: 72.9120, label: 'Govandi Station' },
    endPoint: { lat: 19.0550, lng: 72.9190, label: 'Shivaji Nagar' },
    estimatedLengthKm: 2.8,
    requiredStaff: 4,
  },
  {
    name: 'RCF Township Internal',
    code: 'CHB-R08',
    startPoint: { lat: 19.0510, lng: 72.8870, label: 'RCF Township Gate 1' },
    endPoint: { lat: 19.0470, lng: 72.8840, label: 'RCF Township Gate 3' },
    estimatedLengthKm: 1.5,
    requiredStaff: 2,
  },
  {
    name: 'Swastik Park to Transit Camp',
    code: 'CHB-R09',
    startPoint: { lat: 19.0545, lng: 72.8930, label: 'Swastik Park' },
    endPoint: { lat: 19.0490, lng: 72.8965, label: 'Transit Camp' },
    estimatedLengthKm: 2.0,
    requiredStaff: 3,
  },
  {
    name: 'Chembur Gaothan Loop',
    code: 'CHB-R10',
    startPoint: { lat: 19.0538, lng: 72.8992, label: 'Chembur Gaothan' },
    endPoint: { lat: 19.0560, lng: 72.9005, label: 'Gaothan Market' },
    estimatedLengthKm: 1.2,
    requiredStaff: 2,
  },
];

// ── Staff Data ──

const firstNames = [
  'Rajesh', 'Sunil', 'Anil', 'Prakash', 'Dinesh',
  'Ganesh', 'Mahesh', 'Vijay', 'Sanjay', 'Ramesh',
  'Suresh', 'Deepak', 'Ajay', 'Manoj', 'Ashok',
  'Ravi', 'Santosh', 'Vinod', 'Nilesh', 'Sachin',
  'Balu', 'Kisan', 'Namdev', 'Pandit', 'Tanaji',
  'Dagdu', 'Hanumant', 'Vitthal', 'Bhimrao', 'Arjun',
];

const lastNames = [
  'Patil', 'Jadhav', 'Shinde', 'Pawar', 'More',
  'Kamble', 'Deshmukh', 'Gaikwad', 'Chavan', 'Yadav',
  'Gupta', 'Sharma', 'Mishra', 'Dubey', 'Tiwari',
  'Mane', 'Salunkhe', 'Bhosale', 'Nikam', 'Kadam',
  'Sawant', 'Dhonde', 'Kale', 'Wagh', 'Raut',
  'Dhole', 'Ghule', 'Thorat', 'Sonawane', 'Mahadik',
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI!);
  console.log('Connected.');

  // Clear existing data
  await User.deleteMany({});
  await Route.deleteMany({});
  await mongoose.connection.collection('attendances').deleteMany({});
  await mongoose.connection.collection('routeprogresses').deleteMany({});
  await mongoose.connection.collection('reallocations').deleteMany({});
  if ((await mongoose.connection.db!.listCollections({ name: 'geophotos' }).toArray()).length > 0) {
    await mongoose.connection.collection('geophotos').deleteMany({});
  }
  if ((await mongoose.connection.db!.listCollections({ name: 'verificationlogs' }).toArray()).length > 0) {
    await mongoose.connection.collection('verificationlogs').deleteMany({});
  }
  console.log('Cleared existing data.');

  // Hash a common password for all demo accounts
  const defaultPasswordHash = await bcrypt.hash('bmc123', 10);

  // Create routes
  const createdRoutes = await Route.insertMany(routes);
  console.log(`Created ${createdRoutes.length} routes.`);

  // Best-effort: snap each route to the road network via OSRM. Public demo
  // is rate-limited so we serialise + sleep 200ms between requests. If OSRM
  // is unreachable, routes simply have no polyline and the map falls back
  // to dashed straight lines until an admin re-snaps via /api/routes/[id]/snap.
  const osrmBase = (process.env.OSRM_BASE_URL || 'https://router.project-osrm.org').replace(/\/$/, '');
  console.log(`Snapping route polylines via ${osrmBase}...`);
  let snapped = 0;
  for (const r of createdRoutes) {
    const coords = `${r.startPoint.lng},${r.startPoint.lat};${r.endPoint.lng},${r.endPoint.lat}`;
    const url = `${osrmBase}/route/v1/driving/${coords}?overview=full&geometries=polyline`;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { code?: string; routes?: Array<{ geometry: string; distance: number; duration: number }> } = await res.json();
      if (data.code === 'Ok' && data.routes?.[0]) {
        const route = data.routes[0];
        await Route.updateOne(
          { _id: r._id },
          {
            routePolyline: route.geometry,
            routePolylineSource: 'osrm',
            routeDistanceKm: Math.round((route.distance / 1000) * 100) / 100,
            routeDurationMinutes: Math.round((route.duration / 60) * 10) / 10,
            routePolylineUpdatedAt: new Date(),
          }
        );
        snapped++;
      }
    } catch (err) {
      console.warn(`  - ${r.code}: snap failed (${(err as Error).message})`);
    }
    // Be polite to the public demo
    await new Promise((res) => setTimeout(res, 200));
  }
  console.log(`Snapped ${snapped}/${createdRoutes.length} routes to roads.`);

  // Create admin
  await User.create({
    employeeId: 'BMC-CHB-ADMIN',
    name: { first: 'System', last: 'Admin' },
    role: 'admin',
    phone: '9999900001',
    passwordHash: defaultPasswordHash,
  });
  console.log('Created admin: BMC-CHB-ADMIN / bmc123');

  // Create 3 supervisors
  const supervisorNames = [
    { first: 'Pradeep', last: 'Kulkarni' },
    { first: 'Anita', last: 'Desai' },
    { first: 'Mohan', last: 'Thakur' },
  ];

  for (let i = 0; i < 3; i++) {
    await User.create({
      employeeId: `BMC-CHB-SUP${String(i + 1).padStart(2, '0')}`,
      name: supervisorNames[i],
      role: 'supervisor',
      phone: `99999100${String(i + 1).padStart(2, '0')}`,
      passwordHash: defaultPasswordHash,
    });
  }
  console.log('Created 3 supervisors: BMC-CHB-SUP01 to SUP03 / bmc123');

  // Create 30 staff members, distributed across routes
  const staffMembers = [];
  let staffIndex = 0;

  for (let routeIdx = 0; routeIdx < createdRoutes.length; routeIdx++) {
    const route = createdRoutes[routeIdx];
    const staffCount = route.requiredStaff;

    for (let j = 0; j < staffCount; j++) {
      if (staffIndex >= 30) break;

      staffMembers.push({
        employeeId: `BMC-CHB-${String(staffIndex + 1).padStart(3, '0')}`,
        name: {
          first: firstNames[staffIndex % firstNames.length],
          last: lastNames[staffIndex % lastNames.length],
        },
        role: 'staff',
        phone: `98765${String(staffIndex + 10000).slice(-5)}`,
        passwordHash: defaultPasswordHash,
        assignedRouteId: route._id,
      });

      staffIndex++;
    }
  }

  // Fill remaining slots if needed (up to 30)
  while (staffIndex < 30) {
    const routeIdx = staffIndex % createdRoutes.length;
    staffMembers.push({
      employeeId: `BMC-CHB-${String(staffIndex + 1).padStart(3, '0')}`,
      name: {
        first: firstNames[staffIndex % firstNames.length],
        last: lastNames[staffIndex % lastNames.length],
      },
      role: 'staff',
      phone: `98765${String(staffIndex + 10000).slice(-5)}`,
      passwordHash: defaultPasswordHash,
      assignedRouteId: createdRoutes[routeIdx]._id,
    });
    staffIndex++;
  }

  const createdStaff = await User.insertMany(staffMembers);
  console.log(`Created ${createdStaff.length} staff members: BMC-CHB-001 to BMC-CHB-030 / bmc123`);

  // ── Seed demo attendance for TODAY ──
  // Creates a realistic scenario where some routes are overstaffed/completed
  // and others are critically understaffed, triggering the reallocation engine.

  // Use IST date (matches todayIST() used by every API + cron). Using
  // toISOString() directly returns UTC, which can be a different calendar
  // day for ~5.5 hours each evening — that subtle drift used to leave
  // today's dashboard empty when the seed was re-run after ~18:30 UTC.
  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const today = istNow.toISOString().split('T')[0];

  // Construct a Date for "today at HH:MM IST". The KPI rollup classifies
  // a route's completion time by the IST hour it crossed 100%, so demo
  // completion stamps need to land in real morning/afternoon hours rather
  // than "whatever wall-clock time the seed happened to run at" (which
  // was the previous behaviour and caused all KPIs to read 0% when the
  // seed ran late evening).
  const istClock = (h: number, m: number): Date => {
    const baseUtcMidnight = new Date(`${today}T00:00:00.000Z`).getTime();
    const istMinutes = h * 60 + m;
    return new Date(baseUtcMidnight + (istMinutes - 330) * 60_000);
  };

  const attendanceRecords = [];
  const progressRecords = [];

  // Build a map: routeId -> list of staff assigned to it
  const staffByRoute: Record<string, typeof createdStaff> = {};
  for (const s of createdStaff) {
    const rid = s.assignedRouteId!.toString();
    if (!staffByRoute[rid]) staffByRoute[rid] = [];
    staffByRoute[rid].push(s);
  }

  for (let i = 0; i < createdRoutes.length; i++) {
    const route = createdRoutes[i];
    const rid = route._id.toString();
    const workers = staffByRoute[rid] || [];

    // Scenario per route:
    // R01 (needs 4): ALL 4 present + route completed → surplus after completion
    // R02 (needs 3): ALL 3 present + route completed → surplus after completion
    // R03 (needs 3): ALL 3 present, 75% done → adequate, in progress
    // R04 (needs 3): 2 present → marginal
    // R05 (needs 5): only 1 present → CRITICAL (needs reallocation!)
    // R06 (needs 4): only 1 present → CRITICAL
    // R07 (needs 4): ALL 4 present, 50% done → adequate
    // R08 (needs 2): ALL 2 present + route completed → surplus after completion
    // R09 (needs 3): 2 present → marginal
    // R10 (needs 2): ALL 2 present, 25% done → adequate

    let presentCount: number;
    let routeStatus: string;
    let completionPct: number;
    // IST clock-time when the latest progress update was recorded.
    // For completed routes this becomes the "finished by" timestamp the
    // KPI rollup classifies into the 10am / 12pm / 2pm cutoff buckets.
    let progressTime: Date;

    switch (i) {
      case 0: // R01 - completed early (before 10am)
        presentCount = workers.length;
        routeStatus = 'completed';
        completionPct = 100;
        progressTime = istClock(9, 30);
        break;
      case 1: // R02 - completed mid-morning (before 12pm)
        presentCount = workers.length;
        routeStatus = 'completed';
        completionPct = 100;
        progressTime = istClock(11, 30);
        break;
      case 2: // R03 - in progress, full
        presentCount = workers.length;
        routeStatus = 'in_progress';
        completionPct = 75;
        progressTime = istClock(11, 0);
        break;
      case 3: // R04 - marginal
        presentCount = Math.max(1, workers.length - 1);
        routeStatus = 'in_progress';
        completionPct = 40;
        progressTime = istClock(10, 30);
        break;
      case 4: // R05 - CRITICAL, only 1 of 5
        presentCount = 1;
        routeStatus = 'in_progress';
        completionPct = 10;
        progressTime = istClock(8, 0);
        break;
      case 5: // R06 - CRITICAL, only 1 of 4
        presentCount = 1;
        routeStatus = 'stalled';
        completionPct = 5;
        progressTime = istClock(7, 30);
        break;
      case 6: // R07 - adequate, in progress
        presentCount = workers.length;
        routeStatus = 'in_progress';
        completionPct = 50;
        progressTime = istClock(11, 0);
        break;
      case 7: // R08 - completed early afternoon (before 2pm)
        presentCount = workers.length;
        routeStatus = 'completed';
        completionPct = 100;
        progressTime = istClock(13, 30);
        break;
      case 8: // R09 - marginal
        presentCount = Math.max(1, workers.length - 1);
        routeStatus = 'in_progress';
        completionPct = 30;
        progressTime = istClock(10, 0);
        break;
      case 9: // R10 - adequate
        presentCount = workers.length;
        routeStatus = 'in_progress';
        completionPct = 25;
        progressTime = istClock(9, 30);
        break;
      default:
        presentCount = workers.length;
        routeStatus = 'not_started';
        completionPct = 0;
        progressTime = istClock(6, 0);
    }

    // Create attendance records for present workers
    const presentWorkers = workers.slice(0, presentCount);
    for (const worker of presentWorkers) {
      // Simulate GPS near the route start (within geofence)
      const jitterLat = (Math.random() - 0.5) * 0.001; // ~50m
      const jitterLng = (Math.random() - 0.5) * 0.001;
      const workerLat = route.startPoint.lat + jitterLat;
      const workerLng = route.startPoint.lng + jitterLng;

      // Random check-in time between 05:50 and 06:20
      const checkInHour = 5 + Math.floor(Math.random() * 1);
      const checkInMin = 50 + Math.floor(Math.random() * 30);
      const checkInTime = new Date();
      checkInTime.setHours(checkInHour, checkInMin, 0, 0);

      attendanceRecords.push({
        userId: worker._id,
        routeId: route._id,
        date: today,
        checkInTime,
        coordinates: { lat: workerLat, lng: workerLng, accuracy: 8 + Math.random() * 10 },
        distanceFromRoute: Math.floor(Math.random() * 120), // within 200m
        status: 'verified',
        attempts: 3,
        deviceInfo: { userAgent: 'Android/Chrome', platform: 'Linux armv8l' },
        isOfflineSync: false,
      });
    }

    // Also create 1-2 rejected records for absent workers trying from wrong location (on some routes)
    if (i === 4 || i === 5) {
      const absentWorkers = workers.slice(presentCount, presentCount + 1);
      for (const worker of absentWorkers) {
        const farLat = route.startPoint.lat + 0.005; // ~500m away
        const farLng = route.startPoint.lng + 0.003;
        const checkInTime = new Date();
        checkInTime.setHours(6, 5 + Math.floor(Math.random() * 15), 0, 0);

        attendanceRecords.push({
          userId: worker._id,
          routeId: route._id,
          date: today,
          checkInTime,
          coordinates: { lat: farLat, lng: farLng, accuracy: 25 },
          distanceFromRoute: 350 + Math.floor(Math.random() * 200),
          status: 'rejected',
          rejectionReason: 'Distance exceeds 200m geofence radius',
          attempts: 3,
          deviceInfo: { userAgent: 'Android/Chrome', platform: 'Linux armv8l' },
          isOfflineSync: false,
        });
      }
    }

    // Create route progress
    const ratio = route.requiredStaff > 0 ? presentCount / route.requiredStaff : 0;
    progressRecords.push({
      routeId: route._id,
      date: today,
      status: routeStatus,
      completionPercentage: completionPct,
      staffingSnapshot: {
        required: route.requiredStaff,
        present: presentCount,
        ratio: Math.round(ratio * 100) / 100,
      },
      updates: [{
        time: progressTime,
        percentage: completionPct,
        note: routeStatus === 'completed' ? 'Route collection completed' :
              routeStatus === 'stalled' ? 'Insufficient staff, route stalled' :
              `Progress update: ${completionPct}%`,
      }],
    });
  }

  await Attendance.insertMany(attendanceRecords);
  await RouteProgress.insertMany(progressRecords);

  // ── Seed Verification Logs (demo alerts) ──
  const verificationLogs = [];

  // Missing photo alerts for workers on critical routes
  for (const route of createdRoutes) {
    const rid = route._id.toString();
    const workers = staffByRoute[rid] || [];
    const routeIdx = createdRoutes.indexOf(route);

    // On critical routes R05, R06 - flag missing shift_start photos
    if (routeIdx === 4 || routeIdx === 5) {
      for (const worker of workers.slice(0, 2)) {
        verificationLogs.push({
          type: 'missing_photo',
          severity: 'warning',
          routeId: route._id,
          date: today,
          affectedUserId: worker._id,
          details: {
            message: `${worker.name.first} ${worker.name.last} (${worker.employeeId}) has not submitted shift start photo`,
            coordinates: { lat: route.startPoint.lat, lng: route.startPoint.lng },
          },
          resolution: { status: 'open' },
        });
      }
    }

    // Face mismatch alert on R03 (simulated)
    if (routeIdx === 2 && workers.length > 0) {
      verificationLogs.push({
        type: 'face_mismatch',
        severity: 'critical',
        routeId: route._id,
        date: today,
        affectedUserId: workers[0]._id,
        details: {
          message: `Face mismatch detected for ${workers[0].name.first} ${workers[0].name.last} (${workers[0].employeeId}) - distance: 0.73`,
          faceDistance: 0.73,
          coordinates: { lat: route.startPoint.lat + 0.0003, lng: route.startPoint.lng + 0.0002 },
        },
        resolution: { status: 'open' },
      });
    }

    // No face detected on R07
    if (routeIdx === 6 && workers.length > 1) {
      verificationLogs.push({
        type: 'no_face_detected',
        severity: 'warning',
        routeId: route._id,
        date: today,
        affectedUserId: workers[1]._id,
        details: {
          message: `No face detected in checkpoint photo from ${workers[1].name.first} ${workers[1].name.last} (${workers[1].employeeId})`,
          coordinates: { lat: route.startPoint.lat + 0.001, lng: route.startPoint.lng },
        },
        resolution: { status: 'open' },
      });
    }

    // Headcount mismatch on R04
    if (routeIdx === 3) {
      verificationLogs.push({
        type: 'headcount_mismatch',
        severity: 'info',
        routeId: route._id,
        date: today,
        details: {
          message: `Expected ${route.requiredStaff} workers on ${route.name}, only ${Math.max(1, workers.length - 1)} present in group photo`,
          expectedCount: route.requiredStaff,
          actualCount: Math.max(1, workers.length - 1),
        },
        resolution: { status: 'open' },
      });
    }
  }

  if (verificationLogs.length > 0) {
    await VerificationLog.insertMany(verificationLogs);
    console.log(`Created ${verificationLogs.length} verification log entries`);
  }

  const verified = attendanceRecords.filter(a => a.status === 'verified').length;
  const rejected = attendanceRecords.filter(a => a.status === 'rejected').length;
  console.log(`Created ${attendanceRecords.length} attendance records (${verified} verified, ${rejected} rejected)`);
  console.log(`Created ${progressRecords.length} route progress records`);
  console.log('\nDemo scenario:');
  console.log('  R01, R02, R08 - completed with full staff (surplus workers available)');
  console.log('  R05, R06      - CRITICAL understaffing (reallocation needed!)');
  console.log('  R04, R09      - marginal staffing');
  console.log('  R03, R07, R10 - adequate, in progress');
  console.log('  Verification logs: missing photos, face mismatch, headcount issues');

  // ── Optional: --with-history backfills 29 days of varied data ──
  // Without this, /reliability shows every worker as POOR because there's
  // no past attendance record (so all prior days look like "missed shifts"),
  // and /reports KPI rollup only has today's 3 completions in a 14-day
  // window. The flag synthesises a realistic pattern: per-worker reliability
  // profiles drive attendance probability, which in turn produces a spread
  // of route-day completions for the KPI cards.
  if (process.argv.includes('--with-history')) {
    console.log('\n--- Seeding 29 days of historical data (this may take a few seconds) ---');

    const supervisor = await User.findOne({ role: 'supervisor', employeeId: 'BMC-CHB-SUP01' });

    // 4 reliability tiers. Index ranges below decide who is in each.
    const profiles = [
      { type: 'excellent', attendRate: 0.97, anomalyRate: 0.01, lateRate: 0.02 },
      { type: 'good',      attendRate: 0.90, anomalyRate: 0.04, lateRate: 0.08 },
      { type: 'fair',      attendRate: 0.78, anomalyRate: 0.12, lateRate: 0.20 },
      { type: 'poor',      attendRate: 0.60, anomalyRate: 0.25, lateRate: 0.35 },
    ];
    const profileFor = (i: number) => {
      if (i < 6) return profiles[0];     // 6 excellent (~20%)
      if (i < 15) return profiles[1];    // 9 good      (~30%)
      if (i < 24) return profiles[2];    // 9 fair      (~30%)
      return profiles[3];                // 6 poor      (~20%)
    };

    const histAttendance: any[] = [];
    const histProgress: any[] = [];
    const histUnavail: any[] = [];
    const histLogs: any[] = [];

    const todayMidnightUtcMs = new Date(`${today}T00:00:00.000Z`).getTime();

    for (let dayOffset = 1; dayOffset <= 29; dayOffset++) {
      const dayMs = todayMidnightUtcMs - dayOffset * 86_400_000;
      const day = new Date(dayMs).toISOString().split('T')[0];

      // IST clock helper anchored to this historical day.
      const dayIstClock = (h: number, m: number) =>
        new Date(dayMs + (h * 60 + m - 330) * 60_000);

      // Per-route running tally so we can compute a realistic presentCount.
      const presentByRoute: Record<string, number> = {};

      for (let i = 0; i < createdStaff.length; i++) {
        const worker = createdStaff[i];
        const profile = profileFor(i);
        const rid = worker.assignedRouteId.toString();
        const route = createdRoutes.find((rt) => rt._id.toString() === rid)!;
        if (!route) continue;

        const r = Math.random();
        if (r < profile.attendRate) {
          // Attended. ~5% are rejected (wrong location / poor GPS).
          const isRejected = Math.random() < 0.05;
          const isLate = Math.random() < profile.lateRate;
          const checkInH = isLate ? 6 + Math.floor(Math.random() * 2) : 5;
          const checkInM = 30 + Math.floor(Math.random() * 30);

          histAttendance.push({
            userId: worker._id,
            routeId: route._id,
            date: day,
            checkInTime: dayIstClock(checkInH, checkInM),
            coordinates: {
              lat: route.startPoint.lat + (Math.random() - 0.5) * 0.001,
              lng: route.startPoint.lng + (Math.random() - 0.5) * 0.001,
              accuracy: 8 + Math.random() * 12,
            },
            distanceFromRoute: isRejected
              ? 350 + Math.floor(Math.random() * 200)
              : Math.floor(Math.random() * 120),
            status: isRejected ? 'rejected' : 'verified',
            rejectionReason: isRejected ? 'Distance exceeds 200m geofence radius' : undefined,
            attempts: 1 + Math.floor(Math.random() * 3),
            deviceInfo: { userAgent: 'Android/Chrome', platform: 'Linux armv8l' },
            mockLocation: false,
            isOfflineSync: false,
          });

          if (!isRejected) {
            presentByRoute[rid] = (presentByRoute[rid] ?? 0) + 1;
          }

          // Occasional anomaly log on attended days.
          if (!isRejected && Math.random() < profile.anomalyRate) {
            const kinds = ['route_deviation', 'idle', 'mock_location'] as const;
            const kind = kinds[Math.floor(Math.random() * kinds.length)];
            const severity = kind === 'mock_location' ? 'critical'
              : kind === 'route_deviation' ? 'warning'
              : 'info';
            const message = kind === 'route_deviation'
              ? `${worker.name.first} ${worker.name.last} drifted ~150m from snapped route`
              : kind === 'idle'
                ? `${worker.name.first} stationary for 12 minutes`
                : `Mock-location flag detected on ${worker.name.first}'s device`;

            histLogs.push({
              type: 'location_anomaly',
              severity,
              routeId: route._id,
              date: day,
              affectedUserId: worker._id,
              details: { kind, message },
              // Older alerts more likely to be resolved.
              resolution:
                dayOffset > 7 && supervisor
                  ? {
                      status: 'resolved',
                      resolvedBy: supervisor._id,
                      resolvedAt: new Date(dayMs + 6 * 60 * 60 * 1000),
                      notes: 'Reviewed and closed.',
                    }
                  : { status: 'open' },
            });
          }
        } else {
          // Not attended. 50% declared unavailable, 50% silently absent.
          if (Math.random() < 0.5) {
            const reasons = ['sick', 'personal', 'transport', 'other'] as const;
            histUnavail.push({
              userId: worker._id,
              date: day,
              reason: reasons[Math.floor(Math.random() * reasons.length)],
              declaredAt: dayIstClock(5, 30 + Math.floor(Math.random() * 30)),
              routeId: worker.assignedRouteId,
            });
          }
        }
      }

      // RouteProgress per route for this historical day.
      for (const route of createdRoutes) {
        const rid = route._id.toString();
        const presentCount = presentByRoute[rid] ?? 0;
        const required = route.requiredStaff;
        const ratio = required > 0 ? presentCount / required : 0;

        let status: string;
        let pct: number;
        let progressTime: Date;

        if (ratio >= 0.8) {
          // Most likely completed. Distribute completion times so the
          // KPI rollup card shows a realistic cutoff distribution:
          //   ~40% by 10am, ~35% by 12pm, ~20% by 2pm, ~5% later.
          status = Math.random() < 0.85 ? 'completed' : 'in_progress';
          pct = status === 'completed' ? 100 : 70 + Math.floor(Math.random() * 25);
          if (status === 'completed') {
            const r = Math.random();
            const [h, m] = r < 0.40
              ? [8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60)]
              : r < 0.75
                ? [10 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60)]
                : r < 0.95
                  ? [12 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60)]
                  : [14 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60)];
            progressTime = dayIstClock(h, m);
          } else {
            progressTime = dayIstClock(11, 30);
          }
        } else if (ratio >= 0.5) {
          status = 'in_progress';
          pct = 40 + Math.floor(Math.random() * 35);
          progressTime = dayIstClock(11, 0);
        } else {
          status = ratio < 0.3 ? 'stalled' : 'in_progress';
          pct = Math.floor(Math.random() * 30);
          progressTime = dayIstClock(9, 30);
        }

        histProgress.push({
          routeId: route._id,
          date: day,
          status,
          completionPercentage: pct,
          staffingSnapshot: {
            required,
            present: presentCount,
            ratio: Math.round(ratio * 100) / 100,
          },
          updates: [{
            time: progressTime,
            percentage: pct,
            note: status === 'completed' ? 'Route collection completed'
              : status === 'stalled' ? 'Insufficient staff, route stalled'
              : `Progress update: ${pct}%`,
          }],
        });
      }
    }

    if (histAttendance.length) await Attendance.insertMany(histAttendance);
    if (histProgress.length) await RouteProgress.insertMany(histProgress);
    if (histUnavail.length) await Unavailability.insertMany(histUnavail);
    if (histLogs.length) await VerificationLog.insertMany(histLogs);

    console.log(
      `Historical: ${histAttendance.length} attendance, ${histProgress.length} progress, ${histUnavail.length} unavailability, ${histLogs.length} anomaly logs (29 days)`
    );
    console.log('Reliability scores will now show a realistic spread of Excellent/Good/Fair/Poor.');
    console.log('KPI rollup will show meaningful by-cutoff percentages over the 14-day window.');
  }

  // ── Optional: --with-pings synthesises GPS trails for /replay ──
  // Without this, the GPS Replay page is empty because the seed doesn't
  // create any GPSPing rows (those normally come from the live tracking
  // hook on the staff PWA). The flag generates a realistic ping series
  // along each attended worker's route for today, plus a sample for past
  // days when --with-history is also enabled.
  //
  // Each ping series:
  //   - ~80 pings spaced ~6 min apart over a notional 8-hour shift
  //   - linear interpolation from startPoint to endPoint with GPS noise
  //   - a few workers per day get a deliberate off-route excursion
  //     (5–8 consecutive pings 130–330 m from the path) so deviation
  //     detection has something to highlight in the replay map
  //   - rare mock-location flags (~3% of workers) so the black-bordered
  //     red dot rendering is visible in the replay UI
  if (process.argv.includes('--with-pings')) {
    console.log('\n--- Seeding GPS pings for /replay ---');

    const PINGS_PER_SHIFT = 80;
    const SHIFT_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours of motion

    /**
     * Decode a Google-encoded polyline string into [lat, lng] pairs.
     * Inlined here so the seed remains a single self-contained file.
     * Mirrors src/lib/routing/osrm.ts decodePolyline().
     */
    const decodePolyline = (encoded: string, precision = 5): Array<[number, number]> => {
      const factor = Math.pow(10, precision);
      let index = 0;
      let lat = 0;
      let lng = 0;
      const coords: Array<[number, number]> = [];
      while (index < encoded.length) {
        let result = 0;
        let shift = 0;
        let byte: number;
        do {
          byte = encoded.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);
        const dlat = result & 1 ? ~(result >> 1) : result >> 1;
        lat += dlat;
        result = 0;
        shift = 0;
        do {
          byte = encoded.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);
        const dlng = result & 1 ? ~(result >> 1) : result >> 1;
        lng += dlng;
        coords.push([lat / factor, lng / factor]);
      }
      return coords;
    };

    /**
     * Walk a decoded polyline and return the [lat, lng] at fraction t∈[0,1]
     * by cumulative *Euclidean* segment length (degree-space). The error
     * vs proper haversine is irrelevant within a single ward — the path
     * is a few km, not a continent — and this is ~50× faster.
     */
    const pointAlongPolyline = (
      coords: Array<[number, number]>,
      t: number
    ): [number, number] => {
      if (coords.length === 0) return [0, 0];
      if (coords.length === 1) return coords[0];
      if (t <= 0) return coords[0];
      if (t >= 1) return coords[coords.length - 1];

      const segLens: number[] = [];
      let total = 0;
      for (let i = 1; i < coords.length; i++) {
        const dlat = coords[i][0] - coords[i - 1][0];
        const dlng = coords[i][1] - coords[i - 1][1];
        const len = Math.sqrt(dlat * dlat + dlng * dlng);
        segLens.push(len);
        total += len;
      }
      if (total === 0) return coords[0];

      const target = t * total;
      let acc = 0;
      for (let i = 0; i < segLens.length; i++) {
        if (acc + segLens[i] >= target) {
          const segT = segLens[i] === 0 ? 0 : (target - acc) / segLens[i];
          const lat = coords[i][0] + (coords[i + 1][0] - coords[i][0]) * segT;
          const lng = coords[i][1] + (coords[i + 1][1] - coords[i][1]) * segT;
          return [lat, lng];
        }
        acc += segLens[i];
      }
      return coords[coords.length - 1];
    };

    // OSRM snaps earlier in the seed update Route docs via Route.updateOne(),
    // so the in-memory `createdRoutes` array has stale fields. Refetch fresh
    // documents so routePolyline is actually populated when present.
    type RouteRef = {
      _id: mongoose.Types.ObjectId;
      startPoint: { lat: number; lng: number };
      endPoint: { lat: number; lng: number };
      routePolyline?: string | null;
    };
    const freshRoutes = await Route.find({ _id: { $in: createdRoutes.map((r) => r._id) } })
      .select('_id startPoint endPoint routePolyline')
      .lean();
    const routeById = new Map<string, RouteRef>(
      freshRoutes.map((r) => [r._id.toString(), r as RouteRef])
    );

    // Pre-decode each route's polyline once. Routes whose OSRM snap failed
    // earlier in the seed will have routePolyline === null — those fall
    // back to straight-line interpolation.
    const decodedByRoute = new Map<string, Array<[number, number]> | null>();
    for (const [rid, r] of routeById) {
      if (r.routePolyline) {
        try {
          const decoded = decodePolyline(r.routePolyline);
          decodedByRoute.set(rid, decoded.length >= 2 ? decoded : null);
        } catch {
          decodedByRoute.set(rid, null);
        }
      } else {
        decodedByRoute.set(rid, null);
      }
    }
    const routesWithoutPolyline = Array.from(decodedByRoute.values()).filter((v) => v === null).length;
    if (routesWithoutPolyline > 0) {
      console.log(
        `  (${routesWithoutPolyline} of ${decodedByRoute.size} routes have no snapped polyline; those workers' trails fall back to straight-line interpolation.)`
      );
    }

    /** Generate the ping series for one (worker, date, checkInTime) tuple. */
    function buildPingSeries(
      userId: mongoose.Types.ObjectId,
      routeId: mongoose.Types.ObjectId,
      dateStr: string,
      checkInMs: number
    ): unknown[] {
      const route = routeById.get(routeId.toString());
      if (!route) return [];

      const decoded = decodedByRoute.get(routeId.toString()) ?? null;
      const intervalMs = SHIFT_DURATION_MS / PINGS_PER_SHIFT;

      // ~15% of worker-days have a deviation episode in the middle of shift.
      const hasDeviation = Math.random() < 0.15;
      const devStart = hasDeviation
        ? Math.floor(PINGS_PER_SHIFT * (0.3 + Math.random() * 0.4))
        : -1;
      const devEnd = devStart + 4 + Math.floor(Math.random() * 5);

      // ~3% get a single mock-location ping (black-ring rendering in replay).
      const hasMock = Math.random() < 0.03;
      const mockIdx = hasMock ? Math.floor(Math.random() * PINGS_PER_SHIFT) : -1;

      const out: unknown[] = [];
      for (let i = 0; i < PINGS_PER_SHIFT; i++) {
        const t = i / (PINGS_PER_SHIFT - 1);

        // The path point: walk the polyline if we have one, else linear
        // interpolation between start and end.
        let baseLat: number;
        let baseLng: number;
        if (decoded) {
          const [pLat, pLng] = pointAlongPolyline(decoded, t);
          baseLat = pLat;
          baseLng = pLng;
        } else {
          baseLat = route.startPoint.lat + (route.endPoint.lat - route.startPoint.lat) * t;
          baseLng = route.startPoint.lng + (route.endPoint.lng - route.startPoint.lng) * t;
        }

        const isOff = i >= devStart && i <= devEnd;
        // Off-route: 0.002 deg ≈ 220 m, well past the 120 m deviation threshold.
        // On-route: 0.00012 deg ≈ 13 m, realistic GPS noise.
        const offsetScale = isOff ? 0.002 : 0.00012;
        const lat = baseLat + (Math.random() - 0.5) * offsetScale;
        const lng = baseLng + (Math.random() - 0.5) * offsetScale;

        const distanceMeters = isOff
          ? 130 + Math.floor(Math.random() * 200)
          : Math.floor(Math.random() * 50);

        out.push({
          userId,
          routeId,
          date: dateStr,
          recordedAt: new Date(checkInMs + i * intervalMs),
          clientTime: new Date(checkInMs + i * intervalMs),
          coordinates: {
            lat,
            lng,
            accuracy: 8 + Math.random() * 12,
            speedMps: 1 + Math.random() * 2.5, // walking + occasional jogging speed
            heading: null,
          },
          distanceFromRouteMeters: distanceMeters,
          isOffRoute: isOff,
          mockLocation: i === mockIdx,
        });
      }
      return out;
    }

    // Today's pings: every verified attendance gets a full series.
    const todayAttendance = await Attendance.find({ date: today, status: 'verified' })
      .select('userId routeId checkInTime')
      .lean();

    let todayPings: unknown[] = [];
    for (const att of todayAttendance) {
      todayPings = todayPings.concat(
        buildPingSeries(att.userId, att.routeId, today, new Date(att.checkInTime).getTime())
      );
    }
    if (todayPings.length) {
      // Insert in batches of 1000 to avoid a single oversized BSON document
      // hitting Mongo's bulk-op size limit.
      for (let i = 0; i < todayPings.length; i += 1000) {
        await GPSPing.insertMany(todayPings.slice(i, i + 1000));
      }
    }
    console.log(`Today: ${todayPings.length} pings across ${todayAttendance.length} workers`);

    // Historical pings: only if --with-history was also passed. To keep
    // volume manageable, we sample a SUBSET of the past days' attendance —
    // 4 random workers per day — rather than every worker. That's enough
    // to make the replay date-picker show data on most past dates.
    if (process.argv.includes('--with-history')) {
      const histAttendance = await Attendance.find({
        date: { $ne: today },
        status: 'verified',
      })
        .select('userId routeId date checkInTime')
        .lean();

      // Group by date, then pick a small subset per date.
      const byDate = new Map<string, typeof histAttendance>();
      for (const a of histAttendance) {
        const list = byDate.get(a.date) ?? [];
        list.push(a);
        byDate.set(a.date, list);
      }

      let histPings: unknown[] = [];
      let histDays = 0;
      for (const [dateStr, list] of byDate) {
        // Shuffle and take 4
        const sample = [...list].sort(() => Math.random() - 0.5).slice(0, 4);
        for (const att of sample) {
          histPings = histPings.concat(
            buildPingSeries(att.userId, att.routeId, dateStr, new Date(att.checkInTime).getTime())
          );
        }
        histDays += 1;
      }
      if (histPings.length) {
        for (let i = 0; i < histPings.length; i += 1000) {
          await GPSPing.insertMany(histPings.slice(i, i + 1000));
        }
      }
      console.log(`Historical: ${histPings.length} pings across ${histDays} prior days (4 workers/day sample)`);
    }
  }

  console.log('\n--- Seed Complete ---');
  console.log('Demo Credentials:');
  console.log('  Admin:      BMC-CHB-ADMIN / bmc123');
  console.log('  Supervisor: BMC-CHB-SUP01 / bmc123');
  console.log('  Staff:      BMC-CHB-001   / bmc123');

  const tips: string[] = [];
  if (!process.argv.includes('--with-history')) tips.push('--with-history (29 days of varied attendance, unavailability, anomaly logs)');
  if (!process.argv.includes('--with-pings')) tips.push('--with-pings (GPS trails so /replay is populated)');
  if (tips.length) {
    console.log('\nTip: pass these flags for a denser demo:');
    for (const t of tips) console.log(`  ${t}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
