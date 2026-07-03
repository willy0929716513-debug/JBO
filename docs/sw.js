const NOTIF_DB    = 'nm-notif';
const NOTIF_STORE = 'cfg';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(NOTIF_DB, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(NOTIF_STORE);
    req.onsuccess  = e => resolve(e.target.result);
    req.onerror    = () => reject();
  });
}

async function getCfg() {
  try {
    const db = await openDB();
    return await new Promise(res => {
      const req = db.transaction(NOTIF_STORE, 'readonly').objectStore(NOTIF_STORE).get('notif');
      req.onsuccess = () => res(req.result || {});
      req.onerror   = () => res({});
    });
  } catch { return {}; }
}

async function saveCfg(cfg) {
  try {
    const db = await openDB();
    db.transaction(NOTIF_STORE, 'readwrite').objectStore(NOTIF_STORE).put(cfg, 'notif');
  } catch {}
}

function pad(n) { return String(n).padStart(2, '0'); }

async function tick() {
  const s = await getCfg();
  if (!s.enabled) return;

  const now      = new Date();
  const hhmm     = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const nowMins  = now.getHours() * 60 + now.getMinutes();

  // ── 三餐提醒 ──────────────────────────────────────────
  if (s.meals !== false) {
    const list = [
      { key: 'breakfast', emoji: '🌅', label: '早餐', time: s.breakfast || '08:00' },
      { key: 'lunch',     emoji: '☀️', label: '午餐', time: s.lunch    || '12:00' },
      { key: 'dinner',    emoji: '🌙', label: '晚餐', time: s.dinner   || '18:00' },
    ];
    for (const m of list) {
      if (hhmm === m.time) {
        self.registration.showNotification(`${m.emoji} 記錄${m.label}`, {
          body: `現在 ${m.time}，記得記錄今天的${m.label}！`,
          tag:  `meal-${m.key}-${hhmm}`,
          renotify: false,
          data: { tab: 'food-log' },
        });
      }
    }
  }

  // ── 喝水提醒 ──────────────────────────────────────────
  if (s.water !== false) {
    const [sh, sm] = (s.water_start || '08:00').split(':').map(Number);
    const [eh, em] = (s.water_end   || '22:00').split(':').map(Number);
    const interval  = Number(s.water_interval) || 90;
    const startMins = sh * 60 + sm;
    const endMins   = eh * 60 + em;

    if (nowMins >= startMins && nowMins < endMins) {
      const elapsed = nowMins - startMins;
      if (elapsed % interval === 0) {
        self.registration.showNotification('💧 喝水提醒', {
          body: '記得補充水分，保持健康！',
          tag:  `water-${hhmm}`,
          renotify: false,
          data: { tab: 'water' },
        });
      }
    }
  }
}

// 每分鐘檢查一次
setInterval(tick, 60 * 1000);

// 收到主程式更新設定
self.addEventListener('message', event => {
  if (event.data?.type === 'SAVE_NOTIF') saveCfg(event.data.cfg);
});

// 點通知 → 開或聚焦 App
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
