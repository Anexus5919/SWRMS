'use client';

import { useState, useCallback, useEffect } from 'react';

interface QueuedAttendance {
  coordinates: { lat: number; lng: number; accuracy: number };
  routeId: string;
  timestamp: string;
  deviceInfo: { userAgent: string; platform: string };
}

const STORAGE_KEY = 'swrms_offline_attendance_queue';

function getQueue(): QueuedAttendance[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedAttendance[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedAttendance[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setQueue(getQueue());
  }, []);

  const addToQueue = useCallback((item: QueuedAttendance) => {
    const current = getQueue();
    const updated = [...current, item];
    saveQueue(updated);
    setQueue(updated);
  }, []);

  const syncQueue = useCallback(async () => {
    const current = getQueue();
    if (current.length === 0) return;

    setSyncing(true);

    try {
      const res = await fetch('/api/attendance/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: current }),
      });

      if (res.ok) {
        saveQueue([]);
        setQueue([]);
      }
    } catch {
      // Will retry next time
    } finally {
      setSyncing(false);
    }
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (getQueue().length > 0) {
        syncQueue();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncQueue]);

  return { queue, queueLength: queue.length, addToQueue, syncQueue, syncing };
}
