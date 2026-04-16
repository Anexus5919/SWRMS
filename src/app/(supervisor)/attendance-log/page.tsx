'use client';

export default function AttendanceLogPage() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--neutral-800)] mb-2">
        Attendance Log
      </h2>
      <p className="text-sm text-[var(--neutral-500)] mb-6">
        Verified and rejected attendance records across all routes.
      </p>

      <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--neutral-50)] border-b border-[var(--border)]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Employee</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Route</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Time</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Distance</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-[var(--neutral-400)] text-xs">
                Attendance records will appear here once the system is active.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
