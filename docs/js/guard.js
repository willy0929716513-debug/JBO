// ── NutriMate safety net ────────────────────────────────────────────────────
// Loaded BEFORE app.js. Protects user data and catches problems early:
//   • storage-full protection (prunes old snapshots, warns instead of silently losing data)
//   • asks the browser to keep our storage (reduces iOS/Safari eviction)
//   • records errors so users can send diagnostics
//   • backup reminder + one-time health disclaimer
//   • fallback if Chart.js fails to load
'use strict';

(function () {
  const APP_VERSION = '2026.11.26';
  window.NM_APP_VERSION = APP_VERSION;

  const LS = window.localStorage;
  const rawSet = Storage.prototype.setItem;
  const SNAP_PREFIX = 'nm_snap_';
  const SNAP_KEEP_DAYS = 30;

  // ── Tiny UI helpers (independent of app.js so they work even if it crashed) ──
  function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function onReady(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  function banner(id, html, tone = 'warn') {
    onReady(() => {
      if (document.getElementById(id)) return;
      const colors = tone === 'error'
        ? 'background:#FEF2F2;color:#991B1B;border:1px solid #FCA5A5'
        : tone === 'info' ? 'background:#EFF6FF;color:#1E3A8A;border:1px solid #93C5FD'
        : 'background:#FFFBEB;color:#92400E;border:1px solid #FCD34D';
      const b = el(`<div id="${id}" role="alert" style="position:fixed;left:12px;right:12px;top:calc(env(safe-area-inset-top,0px) + 64px);z-index:9999;border-radius:12px;padding:12px 14px;font-size:0.82rem;line-height:1.6;box-shadow:0 8px 24px rgba(0,0,0,.12);${colors}">${html}</div>`);
      document.body.appendChild(b);
    });
  }
  function closeBanner(id) { document.getElementById(id)?.remove(); }
  window.nmCloseBanner = closeBanner;

  // ── Snapshots: keep only the last 30 days ──
  function snapKeys() {
    const out = [];
    for (let i = 0; i < LS.length; i++) { const k = LS.key(i); if (k && k.startsWith(SNAP_PREFIX)) out.push(k); }
    return out.sort(); // nm_snap_YYYY-MM-DD sorts by date
  }
  function pruneSnapshots(keepDays) {
    const cutoff = new Date(Date.now() - keepDays * 86400000).toISOString().slice(0, 10);
    let removed = 0;
    for (const k of snapKeys()) {
      if (k.slice(SNAP_PREFIX.length) < cutoff) { LS.removeItem(k); removed++; }
    }
    return removed;
  }
  try { pruneSnapshots(SNAP_KEEP_DAYS); } catch {}

  // ── Storage-full protection ──
  function isQuotaError(e) {
    return e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014);
  }
  Storage.prototype.setItem = function (key, value) {
    try {
      return rawSet.call(this, key, value);
    } catch (e) {
      if (!isQuotaError(e) || this !== LS) throw e;
      // 1st try: drop snapshots older than 7 days. 2nd: drop all snapshots and the error log.
      try { pruneSnapshots(7); return rawSet.call(this, key, value); } catch {}
      try { snapKeys().forEach(k => LS.removeItem(k)); LS.removeItem('nm_errlog'); return rawSet.call(this, key, value); } catch {}
      banner('nm-storage-full',
        '⚠️ <strong>手機儲存空間已滿，剛剛這筆資料沒有存到。</strong><br>請到「設定 → 資料備份」先匯出備份，再刪除一些舊記錄。' +
        '<div style="margin-top:8px;text-align:right"><button onclick="nmCloseBanner(\'nm-storage-full\')" style="border:none;background:#92400E;color:#fff;border-radius:8px;padding:6px 12px">知道了</button></div>', 'error');
      throw e; // let the caller stop, so it does not show a false "saved" message
    }
  };

  // ── Ask the browser not to evict our data ──
  try {
    if (navigator.storage?.persist && !LS.getItem('nm_persist_asked')) {
      navigator.storage.persisted().then(p => {
        if (!p) navigator.storage.persist().catch(() => {});
        try { rawSet.call(LS, 'nm_persist_asked', '1'); } catch {}
      }).catch(() => {});
    }
  } catch {}

  // ── Error log (last 30) for diagnostics ──
  let lastErrToast = 0;
  function logError(msg, where) {
    try {
      const list = JSON.parse(LS.getItem('nm_errlog') || '[]');
      list.push({ t: new Date().toISOString(), m: String(msg).slice(0, 300), w: String(where || '').slice(0, 120), v: APP_VERSION });
      rawSet.call(LS, 'nm_errlog', JSON.stringify(list.slice(-30)));
    } catch {}
    const now = Date.now();
    if (now - lastErrToast > 15000 && typeof window.showToast === 'function') {
      lastErrToast = now;
      try { window.showToast('⚠️ 發生小問題，已自動記錄。若持續發生請到「設定 → 問題回報」', 3500); } catch {}
    }
  }
  window.nmLogError = logError;
  window.addEventListener('error', e => {
    // Ignore errors from browser extensions / other origins.
    if (e.filename && !e.filename.startsWith(location.origin)) return;
    if (e.error && isQuotaError(e.error)) return; // already handled by the banner
    logError(e.message || e.error, `${(e.filename || '').split('/').pop()}:${e.lineno || ''}`);
  });
  window.addEventListener('unhandledrejection', e => {
    const r = e.reason;
    if (r && isQuotaError(r)) return;
    if (r && r.name === 'AbortError') return;
    logError(r?.message || r, 'promise');
  });

  window.nmDiagnostics = function () {
    const keys = [];
    let bytes = 0;
    for (let i = 0; i < LS.length; i++) { const k = LS.key(i); const v = LS.getItem(k) || ''; bytes += (k.length + v.length) * 2; keys.push(`${k}:${v.length}`); }
    return [
      `NutriMate ${APP_VERSION}`,
      `時間: ${new Date().toString()}`,
      `裝置: ${navigator.userAgent}`,
      `獨立 App 模式: ${window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone ? '是' : '否'}`,
      `網路: ${navigator.onLine ? '連線' : '離線'}`,
      `儲存用量: 約 ${(bytes / 1024).toFixed(0)} KB`,
      `Pro: ${window.Pro ? window.Pro.statusText() : '未載入'}`,
      `資料: ${keys.filter(k => !k.startsWith('nm_snap_')).join(', ')}`,
      `最近錯誤:`,
      ...JSON.parse(LS.getItem('nm_errlog') || '[]').slice(-10).map(e => `  ${e.t} ${e.m} @${e.w}`),
    ].join('\n'); // never includes API keys, license keys or food data
  };

  // ── Chart.js fallback (if the script failed to load) ──
  onReady(() => {
    if (typeof window.Chart === 'undefined') {
      window.Chart = class { constructor(ctx) { try { const c = ctx?.canvas || ctx; const g = c?.getContext?.('2d'); if (g) { g.font = '13px sans-serif'; g.fillStyle = '#9CA3AF'; g.fillText('圖表載入失敗，請連網後重新開啟', 10, 24); } } catch {} } destroy() {} update() {} };
      logError('Chart.js failed to load', 'vendor');
    }
  });

  // ── Backup reminder ──
  const DAY = 86400000;
  function hasData() {
    try { return JSON.parse(LS.getItem('nm_foods') || '[]').length >= 3 || JSON.parse(LS.getItem('nm_weights') || '[]').length > 1; } catch { return false; }
  }
  window.nmMarkBackedUp = () => { try { rawSet.call(LS, 'nm_last_backup', String(Date.now())); } catch {} closeBanner('nm-backup-reminder'); };
  window.nmSnoozeBackup = () => { try { rawSet.call(LS, 'nm_backup_snooze', String(Date.now() + 7 * DAY)); } catch {} closeBanner('nm-backup-reminder'); };
  onReady(() => setTimeout(() => {
    if (!hasData()) return;
    const last = Number(LS.getItem('nm_last_backup') || 0);
    const snooze = Number(LS.getItem('nm_backup_snooze') || 0);
    if (Date.now() < snooze || Date.now() - last < 14 * DAY) return;
    const days = last ? Math.floor((Date.now() - last) / DAY) : null;
    banner('nm-backup-reminder',
      `💾 <strong>${days ? `已經 ${days} 天沒有備份了` : '你還沒有備份過資料'}</strong><br>資料只存在這支手機裡，換手機或誤刪 App 就會不見。花 5 秒備份一下吧！` +
      '<div style="margin-top:8px;display:flex;gap:8px;justify-content:flex-end">' +
      '<button onclick="nmSnoozeBackup()" style="border:1px solid #D97706;background:transparent;color:#92400E;border-radius:8px;padding:6px 12px">下週再說</button>' +
      '<button onclick="exportData()" style="border:none;background:#D97706;color:#fff;border-radius:8px;padding:6px 12px;font-weight:700">立即備份</button></div>', 'info');
  }, 2500));

  // ── One-time health disclaimer ──
  const DISCLAIMER_KEY = 'nm_disclaimer_v1';
  window.nmAcceptDisclaimer = () => { try { rawSet.call(LS, DISCLAIMER_KEY, new Date().toISOString()); } catch {} document.getElementById('nm-disclaimer')?.remove(); };
  onReady(() => {
    if (LS.getItem(DISCLAIMER_KEY)) return;
    document.body.appendChild(el(`
      <div id="nm-disclaimer" style="position:fixed;inset:0;z-index:10000;background:rgba(15,23,42,.55);display:flex;align-items:flex-end;justify-content:center">
        <div style="background:#fff;width:100%;max-width:480px;border-radius:20px 20px 0 0;padding:22px 20px calc(env(safe-area-inset-bottom,0px) + 20px);font-size:0.86rem;line-height:1.75;color:#1F2937">
          <div style="font-size:1.05rem;font-weight:800;margin-bottom:8px">歡迎使用 NutriMate 🥗</div>
          <div>開始前請先了解：</div>
          <ul style="padding-left:18px;margin:6px 0 10px">
            <li>App 中的熱量、營養素與 AI 辨識結果都是<strong>估算值，僅供參考</strong>，不是醫療或營養診斷。</li>
            <li>如果你有慢性病、懷孕、哺乳、未滿 18 歲或有飲食困擾，請先諮詢醫師或營養師再調整飲食。</li>
            <li>你的記錄<strong>只存在這台裝置</strong>。請定期到「設定 → 資料備份」匯出備份。</li>
          </ul>
          <div style="font-size:0.75rem;color:#6B7280;margin-bottom:12px">繼續使用即表示你同意 <a href="terms.html" target="_blank" rel="noopener">使用條款</a> 與 <a href="privacy.html" target="_blank" rel="noopener">隱私權政策</a>。</div>
          <button onclick="nmAcceptDisclaimer()" style="width:100%;border:none;background:#22C55E;color:#fff;font-weight:800;font-size:0.95rem;border-radius:12px;padding:13px">我了解，開始使用</button>
        </div>
      </div>`));
  });
})();
