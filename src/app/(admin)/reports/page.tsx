'use client';

export default function ReportsPage() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--neutral-800)] mb-2">
        System Reports
      </h2>
      <p className="text-sm text-[var(--neutral-500)] mb-6">
        Attendance analytics, route completion rates, and reallocation history.
      </p>

      <div className="bg-white border border-[var(--border)] rounded-lg p-4">
        <p className="text-sm text-[var(--neutral-500)]">
          Charts and analytics will appear here.
        </p>
      </div>
    </div>
  );
}
