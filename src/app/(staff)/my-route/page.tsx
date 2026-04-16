'use client';

export default function MyRoutePage() {
  return (
    <div className="px-4 pt-6">
      <h2 className="text-lg font-semibold text-[var(--neutral-800)] mb-4">
        My Assigned Route
      </h2>
      <div className="bg-white border border-[var(--border)] rounded-lg p-4">
        <p className="text-sm text-[var(--neutral-500)]">
          Route details and map will be displayed here.
        </p>
      </div>
    </div>
  );
}
