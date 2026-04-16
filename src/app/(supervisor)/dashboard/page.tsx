'use client';

export default function DashboardPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--neutral-800)]">
            Route Dashboard
          </h2>
          <p className="text-sm text-[var(--neutral-500)]">
            Real-time overview of all waste collection routes — Chembur Ward
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-status-green">
            <span className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* Map placeholder */}
      <div className="bg-white border border-[var(--border)] rounded-lg h-72 flex items-center justify-center mb-6">
        <p className="text-sm text-[var(--neutral-400)]">
          Chembur Ward Map — Route visualization will appear here
        </p>
      </div>

      {/* Route cards grid placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white border border-[var(--border)] border-l-4 border-l-status-green rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold text-[var(--neutral-600)]">
                CHB-R{String(i).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-medium text-status-green bg-status-green-light px-2 py-0.5 rounded">
                Adequate
              </span>
            </div>
            <p className="text-sm font-medium text-[var(--neutral-800)] mb-3">
              Sample Route {i}
            </p>
            <div className="flex items-center justify-between text-xs text-[var(--neutral-500)]">
              <span>Staff: 4/5</span>
              <span>Progress: 60%</span>
            </div>
            <div className="mt-2 h-1.5 bg-[var(--neutral-100)] rounded-full overflow-hidden">
              <div className="h-full bg-status-green rounded-full" style={{ width: '60%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
