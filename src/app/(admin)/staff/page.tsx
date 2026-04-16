'use client';

export default function StaffManagementPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--neutral-800)]">
            Staff Management
          </h2>
          <p className="text-sm text-[var(--neutral-500)]">
            Register, view, and manage waste collection staff.
          </p>
        </div>
        <button className="px-4 py-2 text-xs font-medium text-white bg-bmc-700 rounded hover:bg-bmc-800 transition-colors">
          + Register Staff
        </button>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--neutral-50)] border-b border-[var(--border)]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Employee ID</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Assigned Route</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-[var(--neutral-400)] text-xs">
                Staff records will appear here once loaded.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
