// Shared helpers for the NutriMate worker.

export const enc = new TextEncoder();
export const dec = new TextDecoder();

export function b64url(buf) {
  if (typeof buf === 'string') buf = enc.encode(buf);
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function unb64url(str) {
  const pad = '='.repeat((4 - (str.length % 4)) % 4);
  return Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad), c => c.charCodeAt(0));
}

export function concat(...arrays) {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let i = 0;
  for (const a of arrays) { out.set(a, i); i += a.length; }
  return out;
}

export async function sha256hex(text) {
  const d = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export const nowSec = () => Math.floor(Date.now() / 1000);

// Constant-time string compare (for admin token).
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ab = enc.encode(a), bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < Math.max(ab.length, bb.length); i++) diff |= (ab[i] || 0) ^ (bb[i] || 0);
  return diff === 0;
}

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}

// Read a JSON body with a size cap so nobody can send us a huge payload.
export async function readJson(request, maxBytes = 16 * 1024) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > maxBytes) throw new HttpError(413, 'too_large', '資料太大');
  const text = await request.text();
  if (text.length > maxBytes) throw new HttpError(413, 'too_large', '資料太大');
  try { return JSON.parse(text || '{}'); }
  catch { throw new HttpError(400, 'bad_json', '資料格式錯誤'); }
}

// CORS: app routes only answer to the configured origins; admin routes accept any
// origin because they are protected by the admin token instead.
export function corsHeaders(request, env, { anyOrigin = false } = {}) {
  const origin = request.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim()).filter(Boolean);
  let allow = '';
  if (anyOrigin || allowed.includes('*')) allow = origin || '*';
  else if (allowed.includes(origin)) allow = origin;
  const h = {
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
  if (allow) h['Access-Control-Allow-Origin'] = allow;
  return h;
}

export function json(data, status, cors) {
  return new Response(data === null ? null : JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...(cors || {}) },
  });
}

// ── License token signing (ECDSA P-256 / SHA-256) ───────────────────────────
// Token = base64url(payloadJSON) + "." + base64url(signature)

let _signKeyCache = null;
let _verifyKeyCache = null;

// Secrets pasted into the dashboard/CLI sometimes arrive wrapped in quotes or with \" escapes.
// Accept all of those so a copy-paste slip doesn't take the shop down.
export function parseJsonSecret(v) {
  if (v && typeof v === 'object') return v;
  const tries = [v, String(v || '').trim().replace(/^['"]|['"]$/g, ''), String(v || '').trim().replace(/^['"]|['"]$/g, '').replace(/\\"/g, '"')];
  for (const t of tries) {
    try {
      let o = JSON.parse(t);
      if (typeof o === 'string') o = JSON.parse(o);
      if (o && typeof o === 'object') return o;
    } catch {}
  }
  return null;
}

function signingJwk(env) {
  if (!env.LICENSE_SIGNING_JWK) throw new HttpError(500, 'not_configured', '伺服器尚未設定簽章金鑰');
  const o = parseJsonSecret(env.LICENSE_SIGNING_JWK);
  if (!o || o.kty !== 'EC' || !o.x || !o.y || !o.d) throw new HttpError(500, 'not_configured', '簽章金鑰格式錯誤（請重新執行 wrangler secret put LICENSE_SIGNING_JWK）');
  return o;
}

async function signKey(env) {
  if (_signKeyCache?.src === env.LICENSE_SIGNING_JWK) return _signKeyCache.key;
  const jwk = signingJwk(env);
  const key = await crypto.subtle.importKey('jwk', { ...jwk, key_ops: ['sign'] },
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  _signKeyCache = { src: env.LICENSE_SIGNING_JWK, key };
  return key;
}

async function verifyKey(env) {
  if (_verifyKeyCache?.src === env.LICENSE_SIGNING_JWK) return _verifyKeyCache.key;
  const { kty, crv, x, y } = signingJwk(env);
  const key = await crypto.subtle.importKey('jwk', { kty, crv, x, y, key_ops: ['verify'] },
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  _verifyKeyCache = { src: env.LICENSE_SIGNING_JWK, key };
  return key;
}

export async function signToken(env, payload) {
  const body = b64url(JSON.stringify(payload));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, await signKey(env), enc.encode(body));
  return `${body}.${b64url(sig)}`;
}

// Returns the payload if signature is valid (expiry is NOT checked here).
export async function verifyToken(env, token) {
  if (typeof token !== 'string' || token.length > 2048) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, await verifyKey(env), unb64url(sig), enc.encode(body));
    if (!ok) return null;
    return JSON.parse(dec.decode(unb64url(body)));
  } catch { return null; }
}

// ── Rate limiting (fixed window, stored in D1) ──────────────────────────────
export async function rateLimit(env, bucket, limit, windowSec) {
  const now = nowSec();
  const row = await env.DB.prepare('SELECT count, reset_at FROM rate_limits WHERE bucket = ?').bind(bucket).first();
  if (!row || row.reset_at <= now) {
    await env.DB.prepare('INSERT OR REPLACE INTO rate_limits (bucket, count, reset_at) VALUES (?, 1, ?)')
      .bind(bucket, now + windowSec).run();
    return;
  }
  if (row.count >= limit) {
    throw new HttpError(429, 'rate_limited', `嘗試次數太多，請 ${Math.ceil((row.reset_at - now) / 60)} 分鐘後再試`);
  }
  await env.DB.prepare('UPDATE rate_limits SET count = count + 1 WHERE bucket = ?').bind(bucket).run();
}

export function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
}
