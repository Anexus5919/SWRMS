'use client';

import { useSession } from 'next-auth/react';

export default function AttendancePage() {
  const { data: session } = useSession();

  return (
    <div className="px-4 pt-6 flex flex-col items-center">
      <p className="text-xs text-[var(--neutral-500)] mb-2 uppercase tracking-wider">
        {session?.user?.employeeId}
      </p>
      <h2 className="text-lg font-semibold text-[var(--neutral-800)] mb-8">
        Mark Attendance
      </h2>

      {/* Attendance check-in button — will be built out in Phase 2 */}
      <div className="w-48 h-48 rounded-full border-4 border-bmc-700 flex items-center justify-center bg-bmc-50 cursor-pointer hover:bg-bmc-100 transition-colors">
        <div className="text-center">
          <svg className="w-10 h-10 mx-auto text-bmc-700 mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <span className="text-sm font-medium text-bmc-700">Check In</span>
        </div>
      </div>

      <p className="mt-6 text-xs text-[var(--neutral-400)] text-center max-w-xs">
        Tap the button above to mark your attendance. GPS location will be verified against your assigned route.
      </p>
    </div>
  );
}
