// Handles Web Push, notification clicks, and lifecycle events.

self.addEventListener('push', event => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); } catch { return; }
  event.waitUntil(
    self.registration.showNotification(data.title || 'NutriMate', {
      body: data.body || '',
      tag: data.tag || 'push',
      renotify: true,
      data: { tab: (data.tag || '').startsWith('meal') ? 'log' : 'water' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const tab = event.notification.data?.tab;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) {
          c.postMessage({ type: 'OPEN_TAB', tab });
          return c.focus();
        }
      }
      return clients.openWindow('./');
    })
  );
});

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', e  => e.waitUntil(self.clients.claim()));
