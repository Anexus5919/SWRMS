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
  console.log('Past 06:30 IST?    :', istHour >= '06:30' ? 'YES - shifts have lapsed' : 'NO - cron will return 0 by design');

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

  // Distinct attendance dates currently in the DB - exposes the UTC/IST
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
    console.log(`  ${w.employeeId} - ${w.name?.first} ${w.name?.last}`);
  }
  if (wouldFire.length > 10) console.log(`  …and ${wouldFire.length - 10} more`);

  // ── NotificationLog state ─────────────────────────────────────────
  // After the seed there should be ~148 rows (37 unique alerts × 4 recipients).
  // Anything above that means live notifications fired since the seed ran -
  // i.e. the staff progress / attendance / etc. wiring is working.
  console.log('─────────────────────────────────────────');
  const notifTotal = await db.collection('notificationlogs').countDocuments();
  const notifBySeed = 148; // expected post-seed baseline
  console.log('NotificationLog rows:', notifTotal, `(seed baseline: ${notifBySeed})`);
  if (notifTotal > notifBySeed) {
    console.log(`  → ${notifTotal - notifBySeed} new rows since seed - live wiring IS firing.`);
  } else if (notifTotal === notifBySeed) {
    console.log('  → 0 new rows since seed - no staff actions have triggered notifications.');
  } else {
    console.log('  → fewer than baseline - seed may not have populated notifications.');
  }

  // 5 most recent rows with their kind + createdAt so we can see if
  // anything fired in the last few minutes.
  const recent = await db
    .collection('notificationlogs')
    .find({})
    .project({ kind: 1, title: 1, createdAt: 1, recipientRole: 1 })
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();
  console.log('Most recent 5 notifications:');
  for (const n of recent) {
    const created = new Date(n.createdAt);
    const age = Math.floor((Date.now() - created.getTime()) / 1000);
    const ageStr = age < 60 ? `${age}s ago` : age < 3600 ? `${Math.floor(age / 60)}m ago` : `${Math.floor(age / 3600)}h ago`;
    console.log(`  [${ageStr.padStart(8)}] ${n.kind.padEnd(24)} ${n.recipientRole.padEnd(10)} - ${n.title}`);
  }

  // ── Today's RouteProgress ────────────────────────────────────────
  // Helps confirm the staff PUT did persist - if there are 3 entries
  // in updates[] for the demo route but no new NotificationLog row,
  // then the bug is in the API's notify code path, not the dev server.
  console.log('─────────────────────────────────────────');
  const r01 = await db.collection('routes').findOne({ code: 'CHB-R01' });
  if (r01) {
    const r01Progress = await db.collection('routeprogresses').findOne({ routeId: r01._id, date: today });
    if (r01Progress) {
      console.log(`R01 progress today: ${r01Progress.completionPercentage}% (${r01Progress.status})`);
      console.log(`R01 updates[] entries: ${r01Progress.updates?.length ?? 0}`);
      for (const u of (r01Progress.updates ?? []).slice(-3)) {
        const t = new Date(u.time);
        console.log(`  ${t.toLocaleTimeString('en-IN')} ${u.percentage}% ${u.note ? `· ${u.note}` : ''}`);
      }
    }
  }

  console.log('─────────────────────────────────────────');
  await mongoose.disconnect();
  process.exit(0);
}

diagnose().catch((err) => {
  console.error('Diagnose failed:', err);
  process.exit(1);
});
