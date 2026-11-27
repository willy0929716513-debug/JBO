// ── NutriMate Pro (license client) ──────────────────────────────────────────
// Loaded AFTER app.js.
//
// Safety rules built in:
//   • If the worker isn't configured yet, NOTHING is locked (the update can ship before the shop opens).
//   • Pro works offline: the signed token is verified on the device (valid TOKEN_TTL_DAYS, default 45).
//   • Network/server problems never lock out a paying user before their token expires.
//   • Only an explicit "revoked"/"invalid" answer from the server removes Pro (refunds).
'use strict';

(function () {
  const CFG = window.NM_CONFIG || {};
  const LS = window.localStorage;
  const LIC_KEY = 'nm_license';
  const DEV_KEY = 'nm_device_id';
  const REFRESH_EVERY = 3 * 86400;      // seconds
  const WARN_BEFORE_EXP = 10 * 86400;   // start nagging to go online 10 days before expiry

  const configured = !!(CFG.WORKER_URL && CFG.LICENSE_PUBLIC_JWK && CFG.LICENSE_PUBLIC_JWK.x);
  const nowSec = () => Math.floor(Date.now() / 1000);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = (m, d) => { try { window.showToast(m, d); } catch {} };

  // ── Device id ──
  function deviceId() {
    let id = LS.getItem(DEV_KEY);
    if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
      const b = crypto.getRandomValues(new Uint8Array(18));
      id = 'd' + btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      try { LS.setItem(DEV_KEY, id); } catch {}
    }
    return id;
  }
  function deviceLabel() {
    const ua = navigator.userAgent;
    if (/iPhone/.test(ua)) return 'iPhone';
    if (/iPad/.test(ua)) return 'iPad';
    if (/Android/.test(ua)) return 'Android';
    if (/Mac/.test(ua)) return 'Mac';
    if (/Windows/.test(ua)) return 'Windows';
    return '其他裝置';
  }

  // ── Stored license ──
  function load() { try { return JSON.parse(LS.getItem(LIC_KEY) || 'null'); } catch { return null; } }
  function save(v) { try { v ? LS.setItem(LIC_KEY, JSON.stringify(v)) : LS.removeItem(LIC_KEY); } catch {} }

  // ── Token verification (ECDSA P-256) ──
  function unb64url(s) {
    const pad = '='.repeat((4 - (s.length % 4)) % 4);
    return Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad), c => c.charCodeAt(0));
  }
  let pubKeyPromise = null;
  async function verifyToken(token) {
    if (!configured || typeof token !== 'string') return null;
    const [body, sig] = token.split('.');
    if (!body || !sig) return null;
    try {
      if (!crypto?.subtle) return null; // needs https
      pubKeyPromise ||= crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: CFG.LICENSE_PUBLIC_JWK.x, y: CFG.LICENSE_PUBLIC_JWK.y },
        { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
      const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, await pubKeyPromise, unb64url(sig), new TextEncoder().encode(body));
      if (!ok) return null;
      return JSON.parse(new TextDecoder().decode(unb64url(body)));
    } catch { return null; }
  }

  // state.payload is set only after a successful signature check for THIS device.
  const state = { payload: null, checked: false, busy: false };

  async function evaluate() {
    const lic = load();
    state.payload = null;
    if (lic?.token) {
      const p = await verifyToken(lic.token);
      if (p && p.v === 1 && p.d === deviceId()) state.payload = p;
    }
    state.checked = true;
    return state.payload;
  }
  const ready = configured ? evaluate().catch(() => null) : Promise.resolve(null);

  function isPro() {
    if (!configured) return true;
    const p = state.payload;
    return !!(p && p.exp > nowSec());
  }

  // ── API ──
  async function api(path, body) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(CFG.WORKER_URL.replace(/\/+$/, '') + path, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    } catch (e) {
      return { status: 0, data: { error: 'network', message: navigator.onLine ? '連不上伺服器，請稍後再試' : '目前沒有網路，請連網後再試' } };
    } finally { clearTimeout(t); }
  }

  async function activate(rawKey) {
    // Same normalisation as the server: no spaces, upper-case (people often paste with a trailing space or newline).
    const key = String(rawKey || '').trim().toUpperCase().replace(/\s+/g, '');
    if (key.length < 6) { toast('請貼上完整的序號'); return false; }
    if (state.busy) return false;
    state.busy = true;
    try {
      const { status, data } = await api('/license/activate', { key, deviceId: deviceId(), deviceLabel: deviceLabel() });
      if (status === 200 && data.token) {
        const p = await verifyToken(data.token);
        if (!p) { toast('❌ 授權簽章驗證失敗，請聯絡賣家', 4000); window.nmLogError?.('token signature mismatch (check LICENSE_PUBLIC_JWK)', 'pro'); return false; }
        save({ key, token: data.token, lastRefresh: nowSec(), devices: data.devices, maxDevices: data.maxDevices });
        await evaluate();
        toast('🎉 Pro 已啟用，感謝支持！', 3000);
        closePaywall();
        afterChange();
        return true;
      }
      toast('❌ ' + (data.message || `啟用失敗（${status}）`), 5000);
      return false;
    } finally { state.busy = false; }
  }

  async function refresh(force = false) {
    if (!configured) return;
    const lic = load();
    if (!lic?.key) return;
    if (!force && lic.lastRefresh && nowSec() - lic.lastRefresh < REFRESH_EVERY) return;
    if (!navigator.onLine) return;
    const { status, data } = await api('/license/refresh', { key: lic.key, deviceId: deviceId(), deviceLabel: deviceLabel() });
    if (status === 200 && data.token && await verifyToken(data.token)) {
      save({ ...lic, token: data.token, lastRefresh: nowSec(), devices: data.devices, maxDevices: data.maxDevices, lastError: null });
      await evaluate();
      if (force) toast('✅ 授權已更新');
    } else if (status === 403 || status === 404) {
      // Definitive answer: refunded / disabled / not found → remove Pro.
      save(null);
      await evaluate();
      toast('Pro 授權已失效：' + (data.message || ''), 5000);
    } else if (status === 409) {
      // Device slot was taken away (e.g. admin reset + 3 other devices). Keep current token until it expires.
      save({ ...lic, lastError: data.message });
      if (force) toast('⚠️ ' + data.message, 6000);
    } else {
      save({ ...lic, lastError: data.message || `HTTP ${status}` });
      if (force) toast('⚠️ ' + (data.message || '暫時無法驗證，Pro 仍可繼續使用'), 4000);
    }
    afterChange();
  }

  async function deactivate() {
    const lic = load();
    if (!lic) return;
    if (!confirm('要在這台裝置上解除 Pro 嗎？\n解除後可以把名額讓給新的手機，之後也能再用同一組序號啟用。')) return;
    const { status, data } = await api('/license/deactivate', { key: lic.key, deviceId: deviceId() });
    if (status !== 200) { toast('❌ ' + (data.message || '解除失敗，請連網後再試'), 4000); return; }
    try {
      const reg = await navigator.serviceWorker?.ready;
      const sub = await reg?.pushManager?.getSubscription();
      if (sub) await sub.unsubscribe();
    } catch {}
    save(null);
    await evaluate();
    toast('已解除此裝置的 Pro');
    afterChange();
  }

  function afterChange() {
    try { if (document.getElementById('page-settings')?.classList.contains('active')) renderSettingsCard(); } catch {}
    try { window._registerWebPush?.(); } catch {}
    expiryBanner();
  }

  // ── Feature gating ──
  function has(feature) {
    if (!configured) return true;
    if (!CFG.PRO_FEATURES || !CFG.PRO_FEATURES[feature]) return true;
    return isPro();
  }
  function require(feature) {
    if (has(feature)) return true;
    openPaywall(feature);
    return false;
  }

  // ── Paywall ──
  function closePaywall() { document.getElementById('nm-paywall')?.remove(); }
  function openPaywall(feature) {
    closePaywall();
    const f = CFG.PRO_FEATURES || {};
    const lic = load();
    const expired = lic?.token && state.payload && state.payload.exp <= nowSec();
    const list = Object.entries(f).map(([k, v]) =>
      `<li style="display:flex;gap:8px;align-items:center;padding:6px 0;${k === feature ? 'font-weight:800;color:#15803D' : ''}"><span>${esc(v.icon)}</span><span>${esc(v.name)}</span></li>`).join('');
    const wrap = document.createElement('div');
    wrap.id = 'nm-paywall';
    wrap.className = 'modal-overlay';
    wrap.innerHTML = `
      <div class="modal-sheet" style="max-height:90vh;overflow:auto">
        <div class="modal-handle"></div>
        ${expired ? `<div style="background:#FEF3C7;color:#92400E;border-radius:10px;padding:10px 12px;font-size:0.8rem;margin-bottom:12px">你的 Pro 已經很久沒有連網驗證。請連上網路後按下方「重新驗證」，不需要重新購買。</div>` : ''}
        <div style="font-size:1.15rem;font-weight:900;margin-bottom:4px">解鎖 NutriMate Pro ✨</div>
        <div style="font-size:0.82rem;color:var(--muted);margin-bottom:10px">${f[feature] ? `「${esc(f[feature].name)}」是 Pro 功能。` : ''}一次買斷，之後的更新都免費。</div>
        <ul style="list-style:none;padding:0;margin:0 0 14px;font-size:0.88rem">${list}</ul>
        ${CFG.BUY_URL ? `<a href="${esc(CFG.BUY_URL)}" target="_blank" rel="noopener" class="btn-primary" style="display:flex;justify-content:center;text-decoration:none;padding:13px;font-size:0.95rem;margin-bottom:6px">購買 Pro（${esc(CFG.PRICE_LABEL || '')}）</a>
        <div style="font-size:0.7rem;color:var(--muted);text-align:center;margin-bottom:14px">付款後序號會寄到你的 Email，也會顯示在 Gumroad 收據頁</div>` : ''}
        <div style="border-top:1px solid #F3F4F6;padding-top:14px">
          <label class="form-label" for="nm-pw-key">已經購買？輸入序號</label>
          <input id="nm-pw-key" class="form-input" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX" value="${esc(lic?.key || '')}">
          <button id="nm-pw-activate" class="btn-outline" style="width:100%;justify-content:center;margin-top:10px;padding:11px">${expired ? '重新驗證' : '啟用 Pro'}</button>
        </div>
        <button onclick="Pro.closePaywall()" style="width:100%;margin-top:10px;background:none;border:none;color:var(--muted);padding:8px">先不用</button>
      </div>`;
    wrap.addEventListener('click', e => { if (e.target === wrap) closePaywall(); });
    document.body.appendChild(wrap);
    const btn = wrap.querySelector('#nm-pw-activate');
    btn.addEventListener('click', async () => {
      btn.disabled = true; btn.textContent = '驗證中…';
      const ok = await activate(wrap.querySelector('#nm-pw-key').value);
      if (!ok && document.body.contains(btn)) { btn.disabled = false; btn.textContent = '啟用 Pro'; }
    });
  }

  // ── Settings card ──
  function fmtDate(sec) { return new Date(sec * 1000).toLocaleDateString('zh-TW'); }
  function renderSettingsCard() {
    const page = document.getElementById('page-settings');
    if (!page) return;
    let card = document.getElementById('nm-pro-card');
    if (!card) {
      card = document.createElement('div');
      card.id = 'nm-pro-card';
      card.className = 'card fade-in';
      const anchor = page.querySelector('.card');
      page.insertBefore(card, anchor);
    }
    if (!configured) { card.style.display = 'none'; renderSupportCard(); return; }
    card.style.display = '';
    const lic = load();
    const p = state.payload;
    let body;
    if (isPro()) {
      const masked = lic?.key ? lic.key.slice(0, 4) + '••••' + lic.key.slice(-4) : '';
      const soon = p.exp - nowSec() < WARN_BEFORE_EXP;
      body = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div class="card-title" style="margin-bottom:0">✨ NutriMate Pro</div>
          <span style="font-size:0.72rem;background:#DCFCE7;color:#15803D;border-radius:20px;padding:3px 10px;font-weight:700">已啟用</span>
        </div>
        <div style="font-size:0.78rem;color:var(--muted);line-height:1.8">
          序號：${esc(masked)}<br>
          ${lic?.devices ? `裝置：${lic.devices} / ${lic.maxDevices} 台<br>` : ''}
          離線可用至：${fmtDate(p.exp)}（連網時會自動延長）
          ${soon ? '<br><span style="color:#B45309">⚠️ 請找時間連網開一下 App，以免授權過期</span>' : ''}
          ${lic?.lastError ? `<br><span style="color:#B45309">上次驗證：${esc(lic.lastError)}</span>` : ''}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
          <button class="btn-outline" style="justify-content:center;font-size:0.8rem;padding:9px" onclick="Pro.refresh(true)"><i class="bi bi-arrow-repeat"></i> 重新驗證</button>
          <button class="btn-outline" style="justify-content:center;font-size:0.8rem;padding:9px" onclick="Pro.deactivate()"><i class="bi bi-phone"></i> 解除此裝置</button>
        </div>`;
    } else {
      const f = CFG.PRO_FEATURES || {};
      body = `
        <div class="card-title">✨ 升級 NutriMate Pro</div>
        <div style="font-size:0.8rem;color:var(--muted);line-height:1.9;margin-bottom:10px">${Object.values(f).map(v => `${esc(v.icon)} ${esc(v.name)}`).join('<br>')}</div>
        <button class="btn-primary" style="width:100%;justify-content:center;padding:11px" onclick="Pro.openPaywall()">查看 Pro / 輸入序號</button>`;
    }
    card.innerHTML = `<div class="card-body">${body}</div>`;
    renderSupportCard();
  }

  function renderSupportCard() {
    const page = document.getElementById('page-settings');
    if (!page || document.getElementById('nm-support-card')) return;
    const card = document.createElement('div');
    card.id = 'nm-support-card';
    card.className = 'card fade-in';
    card.innerHTML = `<div class="card-body">
      <div class="card-title">🛟 問題回報</div>
      <div style="font-size:0.75rem;color:var(--muted);line-height:1.7;margin-bottom:10px">遇到問題時，按下面按鈕複製「診斷資訊」貼給我們。內容不包含你的飲食記錄、API 金鑰或序號。</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <button class="btn-outline" style="justify-content:center;font-size:0.8rem;padding:9px" onclick="Pro.copyDiagnostics()"><i class="bi bi-clipboard"></i> 複製診斷資訊</button>
        ${CFG.SUPPORT_EMAIL ? `<a class="btn-outline" style="justify-content:center;font-size:0.8rem;padding:9px;text-decoration:none" href="mailto:${esc(CFG.SUPPORT_EMAIL)}?subject=${encodeURIComponent('NutriMate 問題回報')}"><i class="bi bi-envelope"></i> 寫信給我們</a>` : '<span></span>'}
      </div>
      <div style="font-size:0.7rem;color:var(--muted);margin-top:10px">版本 ${esc(window.NM_APP_VERSION || '')} · <a href="privacy.html" target="_blank" rel="noopener">隱私權政策</a> · <a href="terms.html" target="_blank" rel="noopener">使用條款</a></div>
    </div>`;
    page.appendChild(card);
  }

  async function copyDiagnostics() {
    const text = window.nmDiagnostics ? window.nmDiagnostics() : 'n/a';
    try { await navigator.clipboard.writeText(text); toast('✅ 已複製，貼到信件或訊息即可'); }
    catch { prompt('請手動複製以下內容：', text); }
  }

  function statusText() {
    if (!configured) return '未設定（全部功能開放）';
    const p = state.payload;
    if (!p) return load() ? '有序號但授權無效' : '免費版';
    return p.exp > nowSec() ? `Pro（至 ${fmtDate(p.exp)}）` : 'Pro 已過期，待連網驗證';
  }

  // ── Expiry banner: remind to go online well before the offline token runs out ──
  function expiryBanner() {
    document.getElementById('nm-pro-expiry')?.remove();
    const lic = load();
    const p = state.payload;
    if (!configured || !lic || !p) return;
    const left = p.exp - nowSec();
    if (left > 0 && left > WARN_BEFORE_EXP) return;
    const msg = left > 0
      ? `Pro 授權將在 ${Math.ceil(left / 86400)} 天後需要連網驗證，請連上網路開一次 App。`
      : 'Pro 授權已超過離線期限，請連網後到「設定」按「重新驗證」。資料都還在，不需要重新購買。';
    const b = document.createElement('div');
    b.id = 'nm-pro-expiry';
    b.style.cssText = 'margin:0 0 12px;background:#FFFBEB;color:#92400E;border:1px solid #FCD34D;border-radius:12px;padding:10px 12px;font-size:0.78rem;line-height:1.6';
    b.textContent = msg;
    document.getElementById('page-dashboard')?.prepend(b);
  }

  window.Pro = {
    configured, ready, has, require, isPro, activate, refresh, deactivate,
    openPaywall, closePaywall, renderSettingsCard, copyDiagnostics, statusText,
    token: () => (isPro() && configured ? load()?.token : null),
    deviceId,
  };

  // Start-up: verify, then refresh in the background when online.
  ready.then(() => {
    expiryBanner();
    refresh(false).catch(() => {});
  });
  window.addEventListener('online', () => refresh(false).catch(() => {}));
})();
