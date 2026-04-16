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
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Route = mongoose.models.Route || mongoose.model('Route', RouteSchema);

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
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  // Clear existing data
  await User.deleteMany({});
  await Route.deleteMany({});
  console.log('Cleared existing data.');

  // Hash a common password for all demo accounts
  const defaultPasswordHash = await bcrypt.hash('bmc123', 10);

  // Create routes
  const createdRoutes = await Route.insertMany(routes);
  console.log(`Created ${createdRoutes.length} routes.`);

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

  await User.insertMany(staffMembers);
  console.log(`Created ${staffMembers.length} staff members: BMC-CHB-001 to BMC-CHB-030 / bmc123`);

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
