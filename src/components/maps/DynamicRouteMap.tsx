'use client';

import dynamic from 'next/dynamic';

// Leaflet needs window/document, so we must disable SSR
const RouteMap = dynamic(() => import('./RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-[var(--neutral-100)] rounded-lg" style={{ height: '300px' }}>
      <p className="text-xs text-[var(--neutral-400)]">Loading map...</p>
    </div>
  ),
});

export default RouteMap;
