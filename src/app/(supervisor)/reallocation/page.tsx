'use client';

export default function ReallocationPage() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--neutral-800)] mb-2">
        Workforce Reallocation
      </h2>
      <p className="text-sm text-[var(--neutral-500)] mb-6">
        Redistribute idle workers from completed routes to understaffed routes.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Surplus workers */}
        <div className="bg-white border border-[var(--border)] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-[var(--neutral-700)] mb-3">
            Available Workers (Surplus)
          </h3>
          <p className="text-xs text-[var(--neutral-400)]">
            Workers from completed routes will appear here for reassignment.
          </p>
        </div>

        {/* Understaffed routes */}
        <div className="bg-white border border-[var(--border)] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-[var(--neutral-700)] mb-3">
            Understaffed Routes
          </h3>
          <p className="text-xs text-[var(--neutral-400)]">
            Routes needing additional manpower will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
