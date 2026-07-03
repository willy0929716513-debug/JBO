// Notification scheduling is handled by the main thread (app.js scheduleNotifications).
// This SW only handles notification clicks and lifecycle events.

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
