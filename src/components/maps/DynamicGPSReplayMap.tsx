'use client';

import dynamic from 'next/dynamic';

const GPSReplayMap = dynamic(() => import('./GPSReplayMap'), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center bg-[var(--neutral-100)] rounded-lg border border-[var(--border)]"
      style={{ height: '500px' }}
    >
      <p className="text-xs text-[var(--neutral-400)]">Loading replay map...</p>
    </div>
  ),
});

export default GPSReplayMap;
