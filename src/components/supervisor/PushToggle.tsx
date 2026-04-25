'use client';

import { useEffect, useState } from 'react';

/**
 * One-button toggle for browser push notifications.
 *
 * Workflow:
 *   1. Mount: register /sw.js, read existing PushSubscription if any.
 *   2. User clicks Enable: ask Notification.permission → request VAPID
 *      public key → subscribe via PushManager → POST to /api/push/subscribe.
 *   3. User clicks Disable: PushManager.unsubscribe() + DELETE /api/push/subscribe.
 *
 * Visible only when the browser supports Push and ServiceWorker. iOS
 * Safari only supports Web Push when installed as a PWA — we render a
 * helpful hint for those users instead of a broken button.
 *
 * urlBase64ToUint8Array converts the VAPID public key (URL-safe base64)
 * into the Uint8Array that `applicationServerKey` expects.
 */

type State = 'unsupported' | 'pwa-required' | 'idle' | 'enabled' | 'busy' | 'denied' | 'error';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  // Backing ArrayBuffer (not SharedArrayBuffer) so the typed array
  // satisfies `BufferSource` for applicationServerKey under TS strict.
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export default function PushToggle() {
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // Capability gate
      if (typeof window === 'undefined') return;
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        // iOS only allows Push if installed to the home screen as a PWA.
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        // navigator.standalone is iOS-specific; cast through a structural type.
        const isStandalone =
          (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
          (navigator as unknown as { standalone?: boolean }).standalone === true;
        if (cancelled) return;
        setState(isIOS && !isStandalone ? 'pwa-required' : 'unsupported');
        return;
      }

      if (Notification.permission === 'denied') {
        if (!cancelled) setState('denied');
        return;
      }

      try {
        const reg =
          (await navigator.serviceWorker.getRegistration('/')) ??
          (await navigator.serviceWorker.register('/sw.js', { scope: '/' }));
        await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (!cancelled) setState(existing ? 'enabled' : 'idle');
      } catch (e) {
        if (cancelled) return;
        setState('error');
        setError(e instanceof Error ? e.message : 'init failed');
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = async () => {
    setError(null);
    setState('busy');
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'denied') {
        setState('denied');
        return;
      }
      if (permission !== 'granted') {
        setState('idle');
        return;
      }

      const keyRes = await fetch('/api/push/vapid-key').then((r) => r.json());
      if (!keyRes.success) {
        setState('error');
        setError(keyRes.error?.message ?? 'VAPID not configured on the server.');
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyRes.data.publicKey),
      });

      const json = sub.toJSON();
      const postRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      }).then((r) => r.json());

      if (!postRes.success) {
        await sub.unsubscribe();
        setState('error');
        setError(postRes.error?.message ?? 'Failed to register subscription.');
        return;
      }

      setState('enabled');
    } catch (e) {
      setState('error');
      setError(e instanceof Error ? e.message : 'Could not enable notifications.');
    }
  };

  const disable = async () => {
    setError(null);
    setState('busy');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        });
      }
      setState('idle');
    } catch (e) {
      setState('error');
      setError(e instanceof Error ? e.message : 'Could not disable notifications.');
    }
  };

  if (state === 'unsupported') return null;

  if (state === 'pwa-required') {
    return (
      <span
        className="text-[11px] text-[var(--neutral-500)]"
        title="On iOS, install this app to your Home Screen to enable push notifications."
      >
        Push: install to Home Screen on iOS
      </span>
    );
  }

  const baseBtn =
    'inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded border transition-colors';

  if (state === 'enabled') {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={disable}
          className={`${baseBtn} border-status-green text-status-green bg-status-green-light hover:bg-emerald-100`}
          title="Stop receiving push notifications on this device"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-status-green" />
          Push: ON
        </button>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <span className="text-[11px] text-[var(--neutral-500)]" title="Allow notifications in your browser settings to enable.">
        Push: blocked by browser
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={enable}
        disabled={state === 'busy'}
        className={`${baseBtn} border-[var(--border-strong)] text-[var(--neutral-700)] hover:bg-[var(--neutral-50)] disabled:opacity-50`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--neutral-300)]" />
        {state === 'busy' ? 'Enabling…' : 'Enable push alerts'}
      </button>
      {error && state === 'error' && (
        <span className="text-[10px] text-status-red max-w-[220px] text-right leading-tight">
          {error}
        </span>
      )}
    </div>
  );
}
