'use client';

export default function ProgressPage() {
  return (
    <div className="px-4 pt-6">
      <h2 className="text-lg font-semibold text-[var(--neutral-800)] mb-4">
        Route Progress
      </h2>
      <div className="bg-white border border-[var(--border)] rounded-lg p-4">
        <p className="text-sm text-[var(--neutral-500)]">
          Update your route completion progress here.
        </p>
      </div>
    </div>
  );
}
