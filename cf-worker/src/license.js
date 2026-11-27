// License activation for NutriMate Pro.
//
// Flow: the app sends {key, deviceId}. We check the key (Gumroad, or a manual key
// we issued ourselves), enforce the device limit, and return a signed token. The app
// verifies the token offline with the public key, so Pro keeps working without
// internet until the token expires (TOKEN_TTL_DAYS). The app refreshes it every few days,
// which is how refunds/revocations reach the device.

import { HttpError, nowSec, rateLimit, sha256hex, signToken, verifyToken, clientIp } from './util.js';

const KEY_RE    = /^[A-Za-z0-9-]{6,64}$/;
const DEVICE_RE = /^[A-Za-z0-9_-]{8,64}$/;
const STALE_DEVICE_DAYS = 60; // devices unseen this long are freed automatically

const maxDevices = env => Math.max(1, Number(env.MAX_DEVICES) || 3);
const ttlDays    = env => Math.max(1, Number(env.TOKEN_TTL_DAYS) || 45);

export function normalizeKey(key) {
  return String(key || '').trim().toUpperCase().replace(/\s+/g, '');
}

export async function licHashOf(key) {
  return sha256hex('nutrimate-license:' + normalizeKey(key));
}

function validate(body) {
  const key = normalizeKey(body.key);
  const deviceId = String(body.deviceId || '');
  if (!KEY_RE.test(key)) throw new HttpError(400, 'invalid_key', '序號格式不正確，請確認有完整複製');
  if (!DEVICE_RE.test(deviceId)) throw new HttpError(400, 'bad_device', '裝置識別碼錯誤，請重新整理後再試');
  const label = String(body.deviceLabel || '').slice(0, 60);
  return { key, deviceId, label };
}

// Ask Gumroad about the key. Never increments "uses" (we track devices ourselves).
async function gumroadVerify(env, key) {
  if (!env.GUMROAD_PRODUCT_ID) throw new HttpError(500, 'not_configured', '伺服器尚未設定 Gumroad 商品');
  const form = new URLSearchParams({
    product_id: env.GUMROAD_PRODUCT_ID,
    license_key: key,
    increment_uses_count: 'false',
  });
  let resp;
  try {
    resp = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return { unavailable: true };
  }
  if (resp.status >= 500 || resp.status === 429) return { unavailable: true };
  const data = await resp.json().catch(() => null);
  if (!data) return { unavailable: true };
  if (!data.success) {
    const msg = String(data.message || '').toLowerCase();
    return { valid: false, revoked: msg.includes('disabled') };
  }
  const p = data.purchase || {};
  if (p.refunded || p.disputed || p.chargebacked) return { valid: false, revoked: true };
  // Memberships: treat ended/cancelled-and-ended subscriptions as invalid.
  if (p.subscription_ended_at || p.subscription_failed_at) return { valid: false, revoked: true };
  return { valid: true };
}

// Decide whether the key is currently good. Throws HttpError if not.
async function checkKey(env, key, licHash) {
  const row = await env.DB.prepare('SELECT source, status FROM licenses WHERE lic_hash = ?').bind(licHash).first();
  if (row?.status === 'revoked') throw new HttpError(403, 'revoked', '此序號已停用（可能已退款）。如有疑問請聯絡賣家');
  if (row?.source === 'manual') return 'manual';
  if (key.startsWith('NM-')) throw new HttpError(404, 'invalid_key', '找不到這組序號，請確認沒有打錯');

  const g = await gumroadVerify(env, key);
  if (g.unavailable) {
    // Gumroad is down: let already-known good keys through, so paying users are not locked out.
    if (row?.status === 'active') return 'gumroad';
    throw new HttpError(503, 'verify_unavailable', '驗證服務暫時無法連線，請過幾分鐘再試');
  }
  if (!g.valid) {
    if (g.revoked) {
      await revokeHash(env, licHash, 'gumroad');
      throw new HttpError(403, 'revoked', '此序號已停用（可能已退款）。如有疑問請聯絡賣家');
    }
    throw new HttpError(404, 'invalid_key', '找不到這組序號，請確認沒有打錯');
  }
  const now = nowSec();
  await env.DB.prepare(
    `INSERT INTO licenses (lic_hash, source, status, created_at, last_verified_at) VALUES (?, 'gumroad', 'active', ?, ?)
     ON CONFLICT(lic_hash) DO UPDATE SET last_verified_at = excluded.last_verified_at`
  ).bind(licHash, now, now).run();
  return 'gumroad';
}

export async function revokeHash(env, licHash, source = 'manual') {
  const now = nowSec();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO licenses (lic_hash, source, status, created_at) VALUES (?, ?, 'revoked', ?)
       ON CONFLICT(lic_hash) DO UPDATE SET status = 'revoked'`
    ).bind(licHash, source, now),
    env.DB.prepare('DELETE FROM devices WHERE lic_hash = ?').bind(licHash),
    env.DB.prepare('DELETE FROM push_times WHERE sub_id IN (SELECT id FROM push_subs WHERE lic_hash = ?)').bind(licHash),
    env.DB.prepare('DELETE FROM push_subs WHERE lic_hash = ?').bind(licHash),
  ]);
}

async function claimDevice(env, licHash, deviceId, label) {
  const now = nowSec();
  await env.DB.prepare('DELETE FROM devices WHERE lic_hash = ? AND last_seen_at < ?')
    .bind(licHash, now - STALE_DEVICE_DAYS * 86400).run();
  const existing = await env.DB.prepare('SELECT 1 FROM devices WHERE lic_hash = ? AND device_id = ?')
    .bind(licHash, deviceId).first();
  if (existing) {
    await env.DB.prepare('UPDATE devices SET last_seen_at = ?, label = COALESCE(NULLIF(?, \'\'), label) WHERE lic_hash = ? AND device_id = ?')
      .bind(now, label, licHash, deviceId).run();
  } else {
    const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM devices WHERE lic_hash = ?').bind(licHash).first();
    if (n >= maxDevices(env)) {
      throw new HttpError(409, 'device_limit',
        `這組序號已在 ${n} 台裝置上啟用（上限 ${maxDevices(env)} 台）。請先在舊裝置的「設定 → Pro」按「解除此裝置」，或聯絡賣家協助。`);
    }
    await env.DB.prepare('INSERT INTO devices (lic_hash, device_id, label, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)')
      .bind(licHash, deviceId, label, now, now).run();
  }
  const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM devices WHERE lic_hash = ?').bind(licHash).first();
  return n;
}

// POST /license/activate  and  POST /license/refresh
export async function activate(request, env, body) {
  const { key, deviceId, label } = validate(body);
  const licHash = await licHashOf(key);
  await rateLimit(env, 'act-ip:' + clientIp(request), 30, 3600);
  await rateLimit(env, 'act-key:' + licHash, 40, 3600);

  const source = await checkKey(env, key, licHash);
  const devices = await claimDevice(env, licHash, deviceId, label);
  const iat = nowSec();
  const exp = iat + ttlDays(env) * 86400;
  const token = await signToken(env, { v: 1, l: licHash, d: deviceId, s: source, iat, exp });
  return { ok: true, token, exp, devices, maxDevices: maxDevices(env) };
}

// POST /license/deactivate  — frees this device's slot.
export async function deactivate(request, env, body) {
  const { key, deviceId } = validate(body);
  const licHash = await licHashOf(key);
  await rateLimit(env, 'deact-ip:' + clientIp(request), 30, 3600);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM devices WHERE lic_hash = ? AND device_id = ?').bind(licHash, deviceId),
    env.DB.prepare('DELETE FROM push_times WHERE sub_id IN (SELECT id FROM push_subs WHERE lic_hash = ? AND device_id = ?)').bind(licHash, deviceId),
    env.DB.prepare('DELETE FROM push_subs WHERE lic_hash = ? AND device_id = ?').bind(licHash, deviceId),
  ]);
  return { ok: true };
}

// Used by push routes: returns payload of a valid, unexpired token or throws.
export async function requireToken(env, token) {
  const p = await verifyToken(env, token);
  if (!p || p.v !== 1) throw new HttpError(401, 'bad_token', 'Pro 授權無效，請重新啟用');
  if (p.exp < nowSec()) throw new HttpError(401, 'token_expired', 'Pro 授權需要重新連網驗證');
  const row = await env.DB.prepare('SELECT status FROM licenses WHERE lic_hash = ?').bind(p.l).first();
  if (row?.status === 'revoked') throw new HttpError(403, 'revoked', '此序號已停用');
  return p;
}

// ── Admin helpers ───────────────────────────────────────────────────────────

function randomManualKey() {
  // Crockford-ish alphabet without look-alike characters (0/O, 1/I/L).
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(15));
  const chars = [...bytes].map(b => A[b % A.length]).join('');
  return `NM-${chars.slice(0, 5)}-${chars.slice(5, 10)}-${chars.slice(10, 15)}`;
}

export async function adminCreateManual(env, body) {
  const count = Math.min(Math.max(1, Number(body.count) || 1), 100);
  const note = String(body.note || '').slice(0, 200);
  const now = nowSec();
  const keys = [];
  const stmts = [];
  for (let i = 0; i < count; i++) {
    const key = randomManualKey();
    keys.push(key);
    stmts.push(env.DB.prepare("INSERT INTO licenses (lic_hash, source, status, note, created_at) VALUES (?, 'manual', 'active', ?, ?)")
      .bind(await licHashOf(key), note, now));
  }
  await env.DB.batch(stmts);
  return { ok: true, keys };
}

export async function adminInfo(env, body) {
  const key = normalizeKey(body.key);
  if (!KEY_RE.test(key)) throw new HttpError(400, 'invalid_key', '序號格式不正確');
  const licHash = await licHashOf(key);
  const lic = await env.DB.prepare('SELECT source, status, note, created_at, last_verified_at FROM licenses WHERE lic_hash = ?').bind(licHash).first();
  const { results: devices } = await env.DB.prepare('SELECT device_id, label, created_at, last_seen_at FROM devices WHERE lic_hash = ? ORDER BY last_seen_at DESC').bind(licHash).all();
  return { ok: true, license: lic || null, devices: devices || [] };
}

export async function adminResetDevices(env, body) {
  const key = normalizeKey(body.key);
  if (!KEY_RE.test(key)) throw new HttpError(400, 'invalid_key', '序號格式不正確');
  const licHash = await licHashOf(key);
  await env.DB.prepare('DELETE FROM devices WHERE lic_hash = ?').bind(licHash).run();
  return { ok: true };
}

export async function adminRevoke(env, body) {
  const key = normalizeKey(body.key);
  if (!KEY_RE.test(key)) throw new HttpError(400, 'invalid_key', '序號格式不正確');
  await revokeHash(env, await licHashOf(key), key.startsWith('NM-') ? 'manual' : 'gumroad');
  return { ok: true };
}

export async function adminRestore(env, body) {
  const key = normalizeKey(body.key);
  if (!KEY_RE.test(key)) throw new HttpError(400, 'invalid_key', '序號格式不正確');
  await env.DB.prepare("UPDATE licenses SET status = 'active' WHERE lic_hash = ?").bind(await licHashOf(key)).run();
  return { ok: true };
}
