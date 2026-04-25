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

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Route = mongoose.models.Route || mongoose.model('Route', RouteSchema);
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
const RouteProgress = mongoose.models.RouteProgress || mongoose.model('RouteProgress', RouteProgressSchema);
const VerificationLog = mongoose.models.VerificationLog || mongoose.model('VerificationLog', VerificationLogSchema);

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

    switch (i) {
      case 0: // R01 - completed, full staff
        presentCount = workers.length;
        routeStatus = 'completed';
        completionPct = 100;
        break;
      case 1: // R02 - completed, full staff
        presentCount = workers.length;
        routeStatus = 'completed';
        completionPct = 100;
        break;
      case 2: // R03 - in progress, full
        presentCount = workers.length;
        routeStatus = 'in_progress';
        completionPct = 75;
        break;
      case 3: // R04 - marginal
        presentCount = Math.max(1, workers.length - 1);
        routeStatus = 'in_progress';
        completionPct = 40;
        break;
      case 4: // R05 - CRITICAL, only 1 of 5
        presentCount = 1;
        routeStatus = 'in_progress';
        completionPct = 10;
        break;
      case 5: // R06 - CRITICAL, only 1 of 4
        presentCount = 1;
        routeStatus = 'stalled';
        completionPct = 5;
        break;
      case 6: // R07 - adequate, in progress
        presentCount = workers.length;
        routeStatus = 'in_progress';
        completionPct = 50;
        break;
      case 7: // R08 - completed, full staff
        presentCount = workers.length;
        routeStatus = 'completed';
        completionPct = 100;
        break;
      case 8: // R09 - marginal
        presentCount = Math.max(1, workers.length - 1);
        routeStatus = 'in_progress';
        completionPct = 30;
        break;
      case 9: // R10 - adequate
        presentCount = workers.length;
        routeStatus = 'in_progress';
        completionPct = 25;
        break;
      default:
        presentCount = workers.length;
        routeStatus = 'not_started';
        completionPct = 0;
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
        time: new Date(),
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

  console.log('\n--- Seed Complete ---');
  console.log('Demo Credentials:');
  console.log('  Admin:      BMC-CHB-ADMIN / bmc123');
  console.log('  Supervisor: BMC-CHB-SUP01 / bmc123');
  console.log('  Staff:      BMC-CHB-001   / bmc123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
