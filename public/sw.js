/* SWRMS service worker — handles Web Push notifications.
 *
 * Scope is the project root ("/"). Registered from
 * src/components/supervisor/PushToggle.tsx after the user enables push.
 *
 * Two events:
 *   - 'push'              → display the notification.
 *   - 'notificationclick' → focus an existing tab or open the URL.
 */

self.addEventListener('install', (event) => {
  // Activate immediately on first install / update.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  /** @type {{ title?: string; body?: string; tag?: string; url?: string; icon?: string }} */
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: 'SWRMS', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'SWRMS Alert';
  const options = {
    body: payload.body || '',
    tag: payload.tag,
    icon: payload.icon || '/bmc_logo.png',
    badge: '/bmc_logo.png',
    data: { url: payload.url || '/dashboard' },
    // Replace any prior notification with the same tag rather than stacking.
    renotify: !!payload.tag,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      // If a tab is already on the target URL, focus it.
      for (const client of clientsArr) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise focus any existing tab and navigate it.
      if (clientsArr.length > 0 && 'navigate' in clientsArr[0]) {
        return clientsArr[0].navigate(url).then((c) => c && c.focus());
      }
      // No tabs at all — open a new one.
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
      return null;
    })
  );
});
