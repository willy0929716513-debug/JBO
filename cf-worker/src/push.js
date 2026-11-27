// Web Push for NutriMate Pro (multi-user).
// Each browser subscription is stored in D1 with its reminder times pre-converted
// to UTC minutes, so the every-minute cron only reads rows that are due right now.

import { enc, b64url, unb64url, concat, sha256hex, nowSec, HttpError, parseJsonSecret } from './util.js';
import { requireToken } from './license.js';

// ─── VAPID JWT (ES256) ────────────────────────────────────────────────────────
async function makeVapidJwt(endpoint, subject, pubKeyB64, privKeyJwk) {
  const aud = new URL(endpoint).origin;
  const now = Math.floor(Date.now() / 1000);
  const header  = b64url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const payload = b64url(JSON.stringify({ aud, exp: now + 43200, sub: subject }));
  const input   = `${header}.${payload}`;

  const key = await crypto.subtle.importKey(
    'jwk', privKeyJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(input))
  );
  return `${input}.${b64url(sig)}`;
}

// ─── Web Push encryption (RFC 8291 + RFC 8188 aes128gcm) ─────────────────────
async function encryptPayload(plaintext, clientPubB64, authB64) {
  const clientPub = unb64url(clientPubB64);
  const authSecret = unb64url(authB64);

  // Ephemeral ECDH key pair
  const pair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']
  );
  const serverPub = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));

  // ECDH shared secret
  const clientKey = await crypto.subtle.importKey(
    'raw', clientPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []
  );
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: clientKey }, pair.privateKey, 256)
  );

  // RFC 8291: derive IKM_key using auth_secret and ecdh shared secret
  const authInfo = concat(enc.encode('WebPush: info\0'), clientPub, serverPub);
  const s1 = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, ['deriveBits']);
  const ikmKey = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: authSecret, info: authInfo }, s1, 256
  ));

  // RFC 8188: derive CEK (128-bit) and NONCE (96-bit) from random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const s2a = await crypto.subtle.importKey('raw', ikmKey, 'HKDF', false, ['deriveBits']);
  const s2b = await crypto.subtle.importKey('raw', ikmKey, 'HKDF', false, ['deriveBits']);
  const cek = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode('Content-Encoding: aes128gcm\0') }, s2a, 128
  ));
  const nonce = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode('Content-Encoding: nonce\0') }, s2b, 96
  ));

  // AES-128-GCM encrypt (0x02 = last-record delimiter per RFC 8188)
  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const record = concat(enc.encode(plaintext), new Uint8Array([2]));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, record)
  );

  // aes128gcm content-encoding header: salt(16) + rs(4 BE) + idlen(1) + serverPub(65)
  const rsBytes = new Uint8Array(4);
  new DataView(rsBytes.buffer).setUint32(0, 4096, false);
  return concat(salt, rsBytes, new Uint8Array([65]), serverPub, ciphertext);
}

// ─── Send one Web Push ────────────────────────────────────────────────────────
// Returns 'ok' | 'gone' (subscription no longer valid) | 'error'
export async function sendPush(sub, payload, env) {
  const privKeyJwk = parseJsonSecret(env.VAPID_PRIVATE_KEY_JWK);
  if (!privKeyJwk) throw new Error('VAPID_PRIVATE_KEY_JWK is not valid JSON');
  const jwt  = await makeVapidJwt(sub.endpoint, env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, privKeyJwk);
  const body = await encryptPayload(JSON.stringify(payload), sub.p256dh, sub.auth);
  const resp = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '300',
      'Urgency': 'normal',
      'Authorization': `vapid t=${jwt},k=${env.VAPID_PUBLIC_KEY}`,
    },
    body,
    signal: AbortSignal.timeout(10000),
  });
  if (resp.status === 404 || resp.status === 410) return 'gone';
  return resp.ok ? 'ok' : 'error';
}

// ─── Schedule → UTC minutes ──────────────────────────────────────────────────
const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const toMin = (hhmm, def) => {
  const m = HHMM_RE.exec(String(hhmm || '')) || HHMM_RE.exec(def);
  return Number(m[1]) * 60 + Number(m[2]);
};
const fmt = mins => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

// tzOffset = minutes east of UTC (Taiwan = 480). Returns [{utc_min, kind, label}]
export function computeTimes(schedule, tzOffset) {
  const s = schedule || {};
  const tz = Math.max(-840, Math.min(840, Math.round(Number(tzOffset) || 0)));
  const toUtc = local => ((local - tz) % 1440 + 1440) % 1440;
  const out = [];
  if (s.meals !== false) {
    for (const [kind, def] of [['breakfast', '08:00'], ['lunch', '12:00'], ['dinner', '18:00']]) {
      const local = toMin(s[kind], def);
      out.push({ utc_min: toUtc(local), kind, label: fmt(local) });
    }
  }
  if (s.water !== false) {
    const start = toMin(s.water_start, '08:00');
    const end   = toMin(s.water_end, '22:00');
    const interval = Math.max(30, Math.min(600, Number(s.water_interval) || 90));
    if (end > start) {
      for (let t = start; t < end && out.length < 60; t += interval) {
        out.push({ utc_min: toUtc(t), kind: 'water', label: fmt(t) });
      }
    }
  }
  // De-duplicate (same minute + kind)
  const seen = new Set();
  return out.filter(r => { const k = r.utc_min + r.kind; if (seen.has(k)) return false; seen.add(k); return true; });
}

const MESSAGES = {
  breakfast: l => ({ title: '🌅 記錄早餐', body: `現在 ${l}，記得記錄今天的早餐！`, tag: 'meal-breakfast' }),
  lunch:     l => ({ title: '☀️ 記錄午餐', body: `現在 ${l}，記得記錄今天的午餐！`, tag: 'meal-lunch' }),
  dinner:    l => ({ title: '🌙 記錄晚餐', body: `現在 ${l}，記得記錄今天的晚餐！`, tag: 'meal-dinner' }),
  water:     l => ({ title: '💧 喝水提醒', body: '記得補充水分，保持健康！', tag: `water-${l}` }),
};

// ─── Routes ──────────────────────────────────────────────────────────────────
function validSub(sub) {
  const endpoint = String(sub?.endpoint || '');
  const p256dh = String(sub?.keys?.p256dh || '');
  const auth = String(sub?.keys?.auth || '');
  if (!/^https:\/\/[^\s]{10,1000}$/.test(endpoint)) throw new HttpError(400, 'bad_sub', '推播訂閱資料錯誤');
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(p256dh) || !/^[A-Za-z0-9_-]{8,100}$/.test(auth)) throw new HttpError(400, 'bad_sub', '推播訂閱資料錯誤');
  return { endpoint, p256dh, auth };
}

// POST /push/subscribe {token, subscription, schedule, tzOffset}
export async function subscribe(env, body) {
  const tok = await requireToken(env, body.token);
  const { endpoint, p256dh, auth } = validSub(body.subscription);
  const id = await sha256hex(endpoint);
  const times = computeTimes(body.schedule, body.tzOffset);
  const schedHash = await sha256hex(JSON.stringify(times));
  const now = nowSec();

  const existing = await env.DB.prepare('SELECT sched_hash FROM push_subs WHERE id = ?').bind(id).first();
  const stmts = [
    env.DB.prepare(
      `INSERT INTO push_subs (id, endpoint, p256dh, auth, lic_hash, device_id, license_exp, sched_hash, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, lic_hash = excluded.lic_hash,
         device_id = excluded.device_id, license_exp = excluded.license_exp, sched_hash = excluded.sched_hash, updated_at = excluded.updated_at`
    ).bind(id, endpoint, p256dh, auth, tok.l, tok.d, tok.exp, schedHash, now),
  ];
  // Only rewrite the time rows when the schedule actually changed (saves D1 writes).
  if (existing?.sched_hash !== schedHash) {
    stmts.push(env.DB.prepare('DELETE FROM push_times WHERE sub_id = ?').bind(id));
    for (const t of times) {
      stmts.push(env.DB.prepare('INSERT OR IGNORE INTO push_times (sub_id, utc_min, kind, label) VALUES (?, ?, ?, ?)')
        .bind(id, t.utc_min, t.kind, t.label));
    }
  }
  await env.DB.batch(stmts);
  return { ok: true, reminders: times.length };
}

// POST /push/unsubscribe {endpoint}
export async function unsubscribe(env, body) {
  const endpoint = String(body.endpoint || '');
  if (!endpoint) return { ok: true };
  const id = await sha256hex(endpoint);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM push_times WHERE sub_id = ?').bind(id),
    env.DB.prepare('DELETE FROM push_subs WHERE id = ?').bind(id),
  ]);
  return { ok: true };
}

async function removeSub(env, id) {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM push_times WHERE sub_id = ?').bind(id),
    env.DB.prepare('DELETE FROM push_queue WHERE sub_id = ?').bind(id),
    env.DB.prepare('DELETE FROM push_subs WHERE id = ?').bind(id),
  ]);
}

// ─── Cron: runs every minute ─────────────────────────────────────────────────
export async function runDue(env, date = new Date()) {
  if (!env.VAPID_PRIVATE_KEY_JWK || !env.VAPID_PUBLIC_KEY) return { sent: 0, skipped: 'vapid_not_configured' };
  const cap = Math.max(1, Number(env.MAX_PUSH_PER_RUN) || 45);
  const utcMin = date.getUTCHours() * 60 + date.getUTCMinutes();
  const now = Math.floor(date.getTime() / 1000);
  const cols = 's.id, s.endpoint, s.p256dh, s.auth, s.license_exp';

  // 1) Backlog from earlier minutes first (drop anything older than 30 minutes).
  await env.DB.prepare('DELETE FROM push_queue WHERE created_at < ?').bind(now - 1800).run();
  const { results: queued } = await env.DB.prepare(
    `SELECT ${cols}, q.kind, q.label, 1 AS from_queue FROM push_queue q JOIN push_subs s ON s.id = q.sub_id
      ORDER BY q.created_at LIMIT ?`
  ).bind(cap).all();
  // 2) Reminders due this minute.
  const { results: due } = await env.DB.prepare(
    `SELECT ${cols}, t.kind, t.label, 0 AS from_queue FROM push_times t JOIN push_subs s ON s.id = t.sub_id
      WHERE t.utc_min = ? LIMIT 5000`
  ).bind(utcMin).all();

  const all = [...(queued || []), ...(due || [])];
  const now_batch = all.slice(0, cap);
  const overflow = all.slice(cap).filter(r => !r.from_queue);

  const stmts = [];
  for (const r of now_batch.filter(r => r.from_queue)) {
    stmts.push(env.DB.prepare('DELETE FROM push_queue WHERE sub_id = ? AND kind = ? AND label = ?').bind(r.id, r.kind, r.label));
  }
  for (const r of overflow) {
    stmts.push(env.DB.prepare('INSERT OR IGNORE INTO push_queue (sub_id, kind, label, created_at) VALUES (?, ?, ?, ?)').bind(r.id, r.kind, r.label, now));
  }
  if (stmts.length) await env.DB.batch(stmts);
  if (overflow.length) console.warn(`push overflow: ${overflow.length} queued for next minute (raise MAX_PUSH_PER_RUN on a paid plan)`);

  let sent = 0, gone = 0, expired = 0, failed = 0;
  const tasks = now_batch.map(row => async () => {
    if (row.license_exp < now) { expired++; return; }   // Pro lapsed: stop pushing
    const msg = (MESSAGES[row.kind] || MESSAGES.water)(row.label);
    try {
      const r = await sendPush(row, msg, env);
      if (r === 'ok') sent++;
      else if (r === 'gone') { gone++; await removeSub(env, row.id); }
      else failed++;
    } catch (e) { failed++; console.error('push failed', e?.message); }
  });
  for (let i = 0; i < tasks.length; i += 25) await Promise.all(tasks.slice(i, i + 25).map(fn => fn()));

  // Housekeeping once an hour: drop subscriptions whose license expired > 30 days ago, old rate-limit rows.
  if (date.getUTCMinutes() === 7) {
    const cutoff = now - 30 * 86400;
    await env.DB.batch([
      env.DB.prepare('DELETE FROM push_times WHERE sub_id IN (SELECT id FROM push_subs WHERE license_exp < ?)').bind(cutoff),
      env.DB.prepare('DELETE FROM push_queue WHERE sub_id IN (SELECT id FROM push_subs WHERE license_exp < ?)').bind(cutoff),
      env.DB.prepare('DELETE FROM push_subs WHERE license_exp < ?').bind(cutoff),
      env.DB.prepare('DELETE FROM rate_limits WHERE reset_at < ?').bind(now),
    ]);
  }
  return { sent, gone, expired, failed, queued: overflow.length };
}
