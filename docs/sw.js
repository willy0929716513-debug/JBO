// Service worker: versioned caching + push notifications.
// Bump CACHE_VERSION on every deployment so installed PWAs auto-refresh.

const CACHE_VERSION = '20260902a';
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

// Binary plist for NutriMate Watch shortcut — served with application/x-shortcuts so iOS opens it directly in Shortcuts app
const _SHORTCUT_B64 = 'YnBsaXN0MDDcAQIDBAUGBwgJCgsMDQ5wcXJ3eHl6e3x9XxAVV0ZRdWlja0FjdGlvblN1cmZhY2VzXxARV0ZXb3JrZmxvd0FjdGlvbnNfEBdXRldvcmtmbG93Q2xpZW50VmVyc2lvbl8QG1dGV29ya2Zsb3dIYXNPdXRwdXRGYWxsYmFja15XRldvcmtmbG93SWNvbl8QGVdGV29ya2Zsb3dJbXBvcnRRdWVzdGlvbnNfECFXRldvcmtmbG93SW5wdXRDb250ZW50SXRlbUNsYXNzZXNfEB5XRldvcmtmbG93TWluaW11bUNsaWVudFZlcnNpb25fECRXRldvcmtmbG93TWluaW11bUNsaWVudFZlcnNpb25TdHJpbmdfECJXRldvcmtmbG93T3V0cHV0Q29udGVudEl0ZW1DbGFzc2VzXxAaV0ZXb3JrZmxvd1JlY29yZElkZW50aWZpZXJfEA9XRldvcmtmbG93VHlwZXOgpQ8gMUdq0hAREhNfEBpXRldvcmtmbG93QWN0aW9uSWRlbnRpZmllcl8QGldGV29ya2Zsb3dBY3Rpb25QYXJhbWV0ZXJzXxAdaXMud29ya2Zsb3cuYWN0aW9ucy5nZXRoZWFsdGjWFBUWFxgZGhscHR4fXxAQQ3VzdG9tT3V0cHV0TmFtZVRVVUlEXxAUV0ZIZWFsdGhMaW1pdFJlc3VsdHNfEBZXRkhlYWx0aE1heGltdW1SZXN1bHRzXxAVV0ZIZWFsdGhTb3J0RGlyZWN0aW9uXFdGSGVhbHRoVHlwZWRQZY6rkEtS1V8QJEExMDAwMDAxLTAwMDEtMDAwMS0wMDAxLTAwMDAwMDAwMDAwMQkQAVxMYXRlc3QgRmlyc3RXV29ya291dNIQESEiXxAjaXMud29ya2Zsb3cuYWN0aW9ucy5nZXRpdGVtZnJvbWxpc3TUFBUjJCUmJzBXV0ZJbnB1dF8QD1dGSXRlbVNwZWNpZmllcmRnAGWwkEtS1V8QJEExMDAwMDAyLTAwMDItMDAwMi0wMDAyLTAwMDAwMDAwMDAwMtIoKSovVVZhbHVlXxATV0ZTZXJpYWxpemF0aW9uVHlwZdMrLC0aGy5aT3V0cHV0TmFtZVpPdXRwdXRVVUlEVFR5cGVcQWN0aW9uT3V0cHV0XxAVV0ZUZXh0VG9rZW5BdHRhY2htZW50WkZpcnN0IEl0ZW3SEBEyM18QGGlzLndvcmtmbG93LmFjdGlvbnMuZGF0ZdYUFTQ1Njc4OTpERUZWV0ZEYXRlXxAQV0ZEYXRlQWN0aW9uTW9kZVxXRkRhdGVGb3JtYXRfEBFXRkRhdGVGb3JtYXRTdHlsZWSQS1LVZeVnH18QJEExMDAwMDAzLTAwMDMtMDAwMy0wMDAzLTAwMDAwMDAwMDAwM9IoKTsv1DwrLC09JSYuXxAPQWdncmFuZGl6ZW1lbnRzoT7TP0AtQUJDXFByb3BlcnR5TmFtZV8QEFByb3BlcnR5VXNlckluZm9aU3RhcnQgRGF0ZRAAXxAYV0ZQcm9wZXJ0eUFnZ3JhbmRpemVtZW50VkZvcm1hdFp5eXl5LU1NLWRkVkN1c3RvbdIQEUhJXxAbaXMud29ya2Zsb3cuYWN0aW9ucy5nZXR0ZXh00xQVSktMTV8QEFdGVGV4dEFjdGlvblRleHRdTnV0cmlNYXRlIFVSTF8QJEExMDAwMDA0LTAwMDQtMDAwNC0wMDA0LTAwMDAwMDAwMDAwNNIoKU5p0k9QUWhfEBJhdHRhY2htZW50c0J5UmFuZ2VWc3RyaW5n1FJTVFVWV1tfY2dXezU1LCAxfVd7NjEsIDF9V3s2OCwgMX1Xezc1LCAxfVd7ODIsIDF91DwrLC1YJSYuoVnTP0AtWkJDXUFjdGl2aXR5IFR5cGXUPCssLVwlJi6hXdM/QC1eQkNYRHVyYXRpb27UPCssLWAlJi6hYdM/QC1iQkNfEBNUb3RhbCBFbmVyZ3kgQnVybmVk1DwrLC1kJSYuoWXTP0AtZkJDXlRvdGFsIERpc3RhbmNl0yssLTg5Lm8QUwBoAHQAdABwAHMAOgAvAC8AdwBpAGwAbAB5ADAAOQAyADkANwAxADYANQAxADMALQBkAGUAYgB1AGcALgBnAGkAdABoAHUAYgAuAGkAbwAvAEoAQgBPAC8APwB3AGsAPQAxACYAdAB5AHAAZQA9//wAJgBkAHUAcgA9//wAJgBrAGMAYQBsAD3//AAmAGQAaQBzAHQAPf/8ACYAZABhAHQAZQA9//xfEBFXRlRleHRUb2tlblN0cmluZ9IQEWtsXxAbaXMud29ya2Zsb3cuYWN0aW9ucy5vcGVudXJs0hUjbW5fECRBMTAwMDAwNS0wMDA1LTAwMDUtMDAwNS0wMDAwMDAwMDAwMDXSKClvL9MrLC1LTC5UMTI4OQjSc3R1dl8QGVdGV29ya2Zsb3dJY29uR2x5cGhOdW1iZXJfEBhXRldvcmtmbG93SWNvblN0YXJ0Q29sb3IR6WoSiJASAKCgEQOEUzkwMKBfECRCREFFMTIzNC01Njc4LTlBQkMtREVGMC0xMjM0NTY3ODkwMTKgAAgAIQA5AE0AZwCFAJQAsADUAPUBHAFBAV4BcAFxAXcBfAGZAbYB1gHjAfYB+wISAisCQwJQAlkCgAKBAoMCkAKYAp0CwwLMAtQC5gLvAxYDGwMhAzcDPgNJA1QDWQNmA34DiQOOA6kDtgO9A9AD3QPxA/oEIQQmBC8EQQRDBEoEVwRqBHUEdwSSBJkEpASrBLAEzgTVBOgE9gUdBSIFJwU8BUMFTgVWBV4FZgVuBXYFfwWBBYgFlgWfBaEFqAWxBboFvAXDBdkF4gXkBesF+gYBBqoGvgbDBuEG5gcNBxIHGQceBx8HJAdAB1sHXgdjB2QHZQdoB2wHbQeUAAAAAAAAAgEAAAAAAAAAfgAAAAAAAAAAAAAAAAAAB5U=';

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Serve the Shortcuts binary plist with the correct MIME type so iOS offers "Open in Shortcuts"
  if (url.pathname.endsWith('/get-shortcut')) {
    event.respondWith((async () => {
      const bin = atob(_SHORTCUT_B64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new Response(bytes, {
        headers: {
          'Content-Type': 'application/x-shortcuts',
          'Content-Disposition': 'attachment; filename="NutriMate Watch.shortcut"',
        }
      });
    })());
    return;
  }

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
