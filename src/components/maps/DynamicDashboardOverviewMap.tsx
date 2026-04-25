'use client';

import dynamic from 'next/dynamic';

const DashboardOverviewMap = dynamic(() => import('./DashboardOverviewMap'), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center bg-[var(--neutral-100)] rounded-lg border border-[var(--border)]"
      style={{ height: '400px' }}
    >
      <p className="text-xs text-[var(--neutral-400)]">Loading map...</p>
    </div>
  ),
});

export default DashboardOverviewMap;
