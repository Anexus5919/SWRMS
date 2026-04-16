'use client';

import { useState, useCallback } from 'react';
import { GPS_CONFIG } from '@/lib/utils/constants';

export interface GPSPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

export interface GeolocationState {
  position: GPSPosition | null;
  loading: boolean;
  error: string | null;
  attempt: number;
}

function getMedianPosition(positions: GPSPosition[]): GPSPosition {
  const sorted = [...positions];

  const lats = sorted.map((p) => p.lat).sort((a, b) => a - b);
  const lngs = sorted.map((p) => p.lng).sort((a, b) => a - b);
  const accs = sorted.map((p) => p.accuracy).sort((a, b) => a - b);

  const mid = Math.floor(sorted.length / 2);

  return {
    lat: lats[mid],
    lng: lngs[mid],
    accuracy: accs[mid],
  };
}

function getSinglePosition(): Promise<GPSPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject(new Error('Location permission denied. Please enable GPS.'));
            break;
          case err.POSITION_UNAVAILABLE:
            reject(new Error('Location unavailable. Move to an open area.'));
            break;
          case err.TIMEOUT:
            reject(new Error('Location request timed out. Try again.'));
            break;
          default:
            reject(new Error('Failed to get location.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Hook that takes 3 GPS readings with retry intervals,
 * returns the median position to reduce drift.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    loading: false,
    error: null,
    attempt: 0,
  });

  const getPosition = useCallback(async (): Promise<GPSPosition | null> => {
    setState({ position: null, loading: true, error: null, attempt: 0 });

    const readings: GPSPosition[] = [];

    for (let i = 0; i < GPS_CONFIG.MAX_ATTEMPTS; i++) {
      setState((prev) => ({ ...prev, attempt: i + 1 }));

      try {
        const pos = await getSinglePosition();
        readings.push(pos);
      } catch {
        // Continue to next attempt even if one fails
      }

      if (i < GPS_CONFIG.MAX_ATTEMPTS - 1) {
        await delay(GPS_CONFIG.RETRY_INTERVAL_MS);
      }
    }

    if (readings.length === 0) {
      setState({
        position: null,
        loading: false,
        error: 'Could not get GPS position after 3 attempts. Please move to an open area and try again.',
        attempt: GPS_CONFIG.MAX_ATTEMPTS,
      });
      return null;
    }

    const median = readings.length === 1 ? readings[0] : getMedianPosition(readings);

    if (median.accuracy > GPS_CONFIG.MAX_ACCEPTABLE_ACCURACY) {
      setState({
        position: median,
        loading: false,
        error: `GPS accuracy is ${Math.round(median.accuracy)}m (weak signal). Move outdoors for better accuracy.`,
        attempt: GPS_CONFIG.MAX_ATTEMPTS,
      });
      return median; // Still return it, let the user decide
    }

    setState({
      position: median,
      loading: false,
      error: null,
      attempt: GPS_CONFIG.MAX_ATTEMPTS,
    });

    return median;
  }, []);

  return {
    ...state,
    getPosition,
  };
}
