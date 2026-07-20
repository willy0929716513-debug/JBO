// Service worker: versioned caching + push notifications.
// Bump CACHE_VERSION on every deployment so installed PWAs auto-refresh.

const CACHE_VERSION = '20260720c';
const CACHE_NAME = `nutrimate-${CACHE_VERSION}`;
const PRECACHE = [
  './',
  './index.html',
  `./js/app.js?v=${CACHE_VERSION}`,
  `./css/style.css?v=${CACHE_VERSION}`,
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  const isKeyAsset =
    request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.includes('app.js') ||
    url.pathname.includes('style.css');

  if (isKeyAsset) {
    // Network-first: always try to get fresh copy; fall back to cache offline
    event.respondWith(
      fetch(request).then(resp => {
        if (resp.ok) {
          caches.open(CACHE_NAME).then(c => c.put(request, resp.clone()));
        }
        return resp;
      }).catch(() => caches.match(request))
    );
  } else {
    // Cache-first for everything else (icons, fonts, etc.)
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request))
    );
  }
});

// ── Push Notifications ───────────────────────────────────────────────────────

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
