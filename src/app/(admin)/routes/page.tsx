'use client';

export default function RouteManagementPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--neutral-800)]">
            Route Management
          </h2>
          <p className="text-sm text-[var(--neutral-500)]">
            Create and manage waste collection routes for Chembur ward.
          </p>
        </div>
        <button className="px-4 py-2 text-xs font-medium text-white bg-bmc-700 rounded hover:bg-bmc-800 transition-colors">
          + Create Route
        </button>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-lg p-4">
        <p className="text-sm text-[var(--neutral-500)]">
          Route list with map-based management will appear here.
        </p>
      </div>
    </div>
  );
}
