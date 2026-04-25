/**
 * Quick state dump for the missed-shift-alert flow. Run with:
 *   npx tsx seed/diagnose.ts
 *
 * Uses the same MONGODB_URI as the rest of the app. Prints what the
 * cron endpoint would see so you can pinpoint why a 0 result happened.
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';

config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function diagnose() {
  await mongoose.connect(MONGODB_URI!);
  const db = mongoose.connection.db!;

  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const today = istNow.toISOString().split('T')[0];
  const istHour = istNow.toISOString().substr(11, 5);

  console.log('─────────────────────────────────────────');
  console.log('Today IST          :', today);
  console.log('Current IST clock  :', istHour);
  console.log('Past 06:30 IST?    :', istHour >= '06:30' ? 'YES — shifts have lapsed' : 'NO — cron will return 0 by design');

  const staffCount = await db.collection('users').countDocuments({ role: 'staff' });
  const staffWithRoutes = await db.collection('users').countDocuments({
    role: 'staff',
    assignedRouteId: { $ne: null },
  });
  const activeStaff = await db.collection('users').countDocuments({
    role: 'staff',
    isActive: true,
  });
  console.log('─────────────────────────────────────────');
  console.log('Staff total        :', staffCount);
  console.log('Staff active       :', activeStaff);
  console.log('Staff with routes  :', staffWithRoutes);

  const attendanceToday = await db.collection('attendances').countDocuments({ date: today });
  const verifiedToday = await db.collection('attendances').countDocuments({
    date: today,
    status: 'verified',
  });
  const rejectedToday = await db.collection('attendances').countDocuments({
    date: today,
    status: 'rejected',
  });
  const unavailToday = await db.collection('unavailabilities').countDocuments({ date: today });

  console.log('─────────────────────────────────────────');
  console.log(`Attendance today (${today})`);
  console.log('  total            :', attendanceToday);
  console.log('  verified         :', verifiedToday);
  console.log('  rejected         :', rejectedToday);
  console.log('Unavailability today:', unavailToday);

  // Distinct attendance dates currently in the DB — exposes the UTC/IST
  // mismatch if the seed wrote rows under yesterday's date.
  const dates = await db
    .collection('attendances')
    .aggregate([{ $group: { _id: '$date', count: { $sum: 1 } } }, { $sort: { _id: -1 } }])
    .limit(5)
    .toArray();
  console.log('─────────────────────────────────────────');
  console.log('Most recent attendance dates in DB:');
  for (const d of dates) console.log(`  ${d._id} → ${d.count} rows`);

  const pushSubs = await db.collection('pushsubscriptions').countDocuments();
  const supervisorSubs = await db.collection('pushsubscriptions').countDocuments({
    role: { $in: ['supervisor', 'admin'] },
  });
  console.log('─────────────────────────────────────────');
  console.log('Push subscriptions :', pushSubs, `(supervisor/admin: ${supervisorSubs})`);

  // Workers who would qualify as "missed" right now.
  const staff = await db
    .collection('users')
    .find({ role: 'staff', isActive: true, assignedRouteId: { $ne: null } })
    .project({ _id: 1, name: 1, employeeId: 1, assignedRouteId: 1 })
    .toArray();

  const attended = await db
    .collection('attendances')
    .find({ date: today })
    .project({ userId: 1 })
    .toArray();
  const attendedSet = new Set(attended.map((a) => a.userId.toString()));

  const unavailable = await db
    .collection('unavailabilities')
    .find({ date: today })
    .project({ userId: 1 })
    .toArray();
  const unavailSet = new Set(unavailable.map((u) => u.userId.toString()));

  const wouldFire = staff.filter(
    (w) => !attendedSet.has(w._id.toString()) && !unavailSet.has(w._id.toString())
  );
  console.log('─────────────────────────────────────────');
  console.log('Would fire (assuming shift has lapsed):', wouldFire.length);
  for (const w of wouldFire.slice(0, 10)) {
    console.log(`  ${w.employeeId} — ${w.name?.first} ${w.name?.last}`);
  }
  if (wouldFire.length > 10) console.log(`  …and ${wouldFire.length - 10} more`);

  console.log('─────────────────────────────────────────');
  await mongoose.disconnect();
  process.exit(0);
}

diagnose().catch((err) => {
  console.error('Diagnose failed:', err);
  process.exit(1);
});
