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
  /** @type {{ title?: string; body?: string; tag?: string; url?: string; icon?: string; notificationId?: string }} */
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
    data: {
      url: payload.url || '/dashboard',
      // Carry the NotificationLog id so notificationclick can ping
      // /api/notifications/:id/read with via=click.
      notificationId: payload.notificationId || null,
    },
    // Replace any prior notification with the same tag rather than stacking.
    renotify: !!payload.tag,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url = data.url || '/dashboard';
  const notificationId = data.notificationId;

  // Mark the inbox row as read (and clickedAt) so the bell badge updates
  // even if the user navigates back to a tab that's already open.
  const markRead = notificationId
    ? fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ via: 'click' }),
      }).catch(() => {})
    : Promise.resolve();

  const focusOrOpen = self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientsArr) => {
      for (const client of clientsArr) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clientsArr.length > 0 && 'navigate' in clientsArr[0]) {
        return clientsArr[0].navigate(url).then((c) => c && c.focus());
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
      return null;
    });

  event.waitUntil(Promise.all([markRead, focusOrOpen]));
});
