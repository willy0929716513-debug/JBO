// Run: node --test test/   (Node 22+, uses built-in node:sqlite as a stand-in for D1)
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';

import worker from '../src/index.js';
import { computeTimes, runDue } from '../src/push.js';

// ── Minimal D1 adapter over node:sqlite ──────────────────────────────────────
function makeD1() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  const stmt = (sql, params = []) => ({
    sql, params,
    bind: (...p) => stmt(sql, p),
    first: async () => db.prepare(sql).get(...params) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...params) }),
    run: async () => { db.prepare(sql).run(...params); return { success: true }; },
  });
  return {
    _db: db,
    prepare: sql => stmt(sql),
    batch: async list => { db.exec('BEGIN'); try { for (const s of list) db.prepare(s.sql).run(...s.params); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } return []; },
  };
}

// ── Fake Gumroad + push service ──────────────────────────────────────────────
let gumroad;      // key -> purchase object | 'down'
let pushLog;      // endpoints that received a push
let pushStatus;   // endpoint -> status code
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  url = String(url);
  if (url.startsWith('https://api.gumroad.com/')) {
    if (gumroad === 'down') throw new Error('network down');
    const key = new URLSearchParams(init.body.toString()).get('license_key');
    assert.equal(new URLSearchParams(init.body.toString()).get('increment_uses_count'), 'false');
    const p = gumroad[key];
    if (!p) return new Response(JSON.stringify({ success: false, message: 'That license does not exist for the provided product.' }), { status: 404 });
    if (p === 'disabled') return new Response(JSON.stringify({ success: false, message: 'This license key has been disabled.' }), { status: 404 });
    return new Response(JSON.stringify({ success: true, uses: 0, purchase: p }), { status: 200 });
  }
  if (url.startsWith('https://push.example/')) {
    pushLog.push(url);
    return new Response(null, { status: pushStatus[url] || 201 });
  }
  return realFetch(url, init);
};

// ── Keys ─────────────────────────────────────────────────────────────────────
const b64url = b => Buffer.from(b).toString('base64url');
async function ecJwk() {
  const p = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  return { jwk: await webcrypto.subtle.exportKey('jwk', p.privateKey), raw: new Uint8Array(await webcrypto.subtle.exportKey('raw', p.publicKey)) };
}
const LIC = await ecJwk();
const VAP = await ecJwk();
// A real browser subscription key pair (for payload encryption)
const SUBKEY = await webcrypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
const SUB_P256DH = b64url(new Uint8Array(await webcrypto.subtle.exportKey('raw', SUBKEY.publicKey)));
const SUB_AUTH = b64url(webcrypto.getRandomValues(new Uint8Array(16)));

const ORIGIN = 'https://willy0929716513-debug.github.io';
let env;
beforeEach(() => {
  gumroad = { 'GOOD-KEY-1234': { refunded: false }, 'REFUND-KEY-1': { refunded: true } };
  pushLog = []; pushStatus = {};
  env = {
    DB: makeD1(),
    ALLOWED_ORIGINS: ORIGIN,
    GUMROAD_PRODUCT_ID: 'prod123',
    MAX_DEVICES: '3', TOKEN_TTL_DAYS: '45', MAX_PUSH_PER_RUN: '45',
    LICENSE_SIGNING_JWK: JSON.stringify(LIC.jwk),
    ADMIN_TOKEN: 'admin-token-very-long-123',
    VAPID_PUBLIC_KEY: b64url(VAP.raw),
    VAPID_PRIVATE_KEY_JWK: JSON.stringify(VAP.jwk),
    VAPID_SUBJECT: 'mailto:test@example.com',
  };
});

async function call(method, path, body, headers = {}) {
  const req = new Request('https://api.test' + path, {
    method, headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'CF-Connecting-IP': '1.2.3.4', ...headers },
    body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
  });
  const res = await worker.fetch(req, env);
  const text = await res.text();
  return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null };
}
const activate = (key, deviceId) => call('POST', '/license/activate', { key, deviceId });

// Verify a token exactly the way the browser app does.
async function appVerify(token) {
  const [body, sig] = token.split('.');
  const pub = await webcrypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: LIC.jwk.x, y: LIC.jwk.y },
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  const ok = await webcrypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, Buffer.from(sig, 'base64url'), Buffer.from(body));
  return ok ? JSON.parse(Buffer.from(body, 'base64url').toString()) : null;
}

// ── Tests ────────────────────────────────────────────────────────────────────
test('activate a valid Gumroad key → signed token the app can verify', async () => {
  const r = await activate(' good-key-1234 ', 'device-aaaa-1111');
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const p = await appVerify(r.body.token);
  assert.ok(p, 'signature verifies');
  assert.equal(p.d, 'device-aaaa-1111');
  assert.ok(p.exp - p.iat === 45 * 86400);
  assert.equal(r.headers.get('access-control-allow-origin'), ORIGIN);
  // tampering breaks the signature
  const [b, s] = r.body.token.split('.');
  const forged = Buffer.from(JSON.stringify({ ...p, exp: p.exp + 1e9 })).toString('base64url');
  assert.equal(await appVerify(`${forged}.${s}`), null);
});

test('unknown key is rejected', async () => {
  const r = await activate('NOPE-NOPE-1', 'device-aaaa-1111');
  assert.equal(r.status, 404);
  assert.equal(r.body.error, 'invalid_key');
});

test('device limit: 4th device refused, deactivate frees a slot, same device re-activates fine', async () => {
  for (const d of ['dev-11111111', 'dev-22222222', 'dev-33333333']) assert.equal((await activate('GOOD-KEY-1234', d)).status, 200);
  assert.equal((await activate('GOOD-KEY-1234', 'dev-11111111')).status, 200, 'existing device ok');
  const r4 = await activate('GOOD-KEY-1234', 'dev-44444444');
  assert.equal(r4.status, 409); assert.equal(r4.body.error, 'device_limit');
  assert.equal((await call('POST', '/license/deactivate', { key: 'GOOD-KEY-1234', deviceId: 'dev-11111111' })).status, 200);
  assert.equal((await activate('GOOD-KEY-1234', 'dev-44444444')).status, 200);
});

test('stale devices (60+ days unseen) are freed automatically', async () => {
  for (const d of ['dev-11111111', 'dev-22222222', 'dev-33333333']) await activate('GOOD-KEY-1234', d);
  env.DB._db.exec(`UPDATE devices SET last_seen_at = last_seen_at - ${61 * 86400} WHERE device_id = 'dev-11111111'`);
  assert.equal((await activate('GOOD-KEY-1234', 'dev-44444444')).status, 200);
});

test('refunded purchase → revoked, and stays revoked', async () => {
  const r = await activate('REFUND-KEY-1', 'device-aaaa-1111');
  assert.equal(r.status, 403); assert.equal(r.body.error, 'revoked');
  gumroad['REFUND-KEY-1'] = { refunded: false };
  assert.equal((await activate('REFUND-KEY-1', 'device-aaaa-1111')).status, 403, 'local revocation sticks');
});

test('refund after activation: refresh revokes and removes devices + push', async () => {
  const a = await activate('GOOD-KEY-1234', 'device-aaaa-1111');
  await call('POST', '/push/subscribe', { token: a.body.token, subscription: { endpoint: 'https://push.example/1', keys: { p256dh: SUB_P256DH, auth: SUB_AUTH } }, schedule: {}, tzOffset: 480 });
  gumroad['GOOD-KEY-1234'] = { refunded: true };
  const r = await call('POST', '/license/refresh', { key: 'GOOD-KEY-1234', deviceId: 'device-aaaa-1111' });
  assert.equal(r.status, 403);
  assert.equal(env.DB._db.prepare('SELECT COUNT(*) n FROM devices').get().n, 0);
  assert.equal(env.DB._db.prepare('SELECT COUNT(*) n FROM push_subs').get().n, 0);
  // the old token can no longer subscribe to push
  const s = await call('POST', '/push/subscribe', { token: a.body.token, subscription: { endpoint: 'https://push.example/1', keys: { p256dh: SUB_P256DH, auth: SUB_AUTH } }, schedule: {}, tzOffset: 480 });
  assert.equal(s.status, 403);
});

test('disabled key on Gumroad → revoked', async () => {
  gumroad['DIS-KEY-123'] = 'disabled';
  assert.equal((await activate('DIS-KEY-123', 'device-aaaa-1111')).body.error, 'revoked');
});

test('Gumroad down: known good key still works, unknown key gets a clear retry message', async () => {
  assert.equal((await activate('GOOD-KEY-1234', 'device-aaaa-1111')).status, 200);
  gumroad = 'down';
  assert.equal((await activate('GOOD-KEY-1234', 'device-aaaa-1111')).status, 200);
  const r = await activate('NEW-KEY-9999', 'device-aaaa-1111');
  assert.equal(r.status, 503); assert.equal(r.body.error, 'verify_unavailable');
});

test('admin: wrong token refused; create manual keys; activate; info; revoke; restore', async () => {
  assert.equal((await call('POST', '/admin/create-keys', { count: 2 }, { Authorization: 'Bearer wrong' })).status, 401);
  const H = { Authorization: 'Bearer ' + env.ADMIN_TOKEN };
  const c = await call('POST', '/admin/create-keys', { count: 2, note: 'Pinkoi #1001' }, H);
  assert.equal(c.status, 200); assert.equal(c.body.keys.length, 2);
  const key = c.body.keys[0];
  assert.match(key, /^NM-[A-Z2-9]{5}-[A-Z2-9]{5}-[A-Z2-9]{5}$/);
  assert.equal((await activate(key.toLowerCase(), 'device-aaaa-1111')).status, 200, 'case-insensitive');
  const info = await call('POST', '/admin/info', { key }, H);
  assert.equal(info.body.license.note, 'Pinkoi #1001'); assert.equal(info.body.devices.length, 1);
  await call('POST', '/admin/revoke', { key }, H);
  assert.equal((await activate(key, 'device-aaaa-1111')).status, 403);
  await call('POST', '/admin/restore', { key }, H);
  assert.equal((await activate(key, 'device-aaaa-1111')).status, 200);
  assert.equal((await activate('NM-AAAAA-BBBBB-CCCCC', 'device-aaaa-1111')).status, 404, 'made-up manual key');
});

test('admin reset-devices', async () => {
  const H = { Authorization: 'Bearer ' + env.ADMIN_TOKEN };
  for (const d of ['dev-11111111', 'dev-22222222', 'dev-33333333']) await activate('GOOD-KEY-1234', d);
  await call('POST', '/admin/reset-devices', { key: 'GOOD-KEY-1234' }, H);
  assert.equal((await activate('GOOD-KEY-1234', 'dev-44444444')).status, 200);
});

test('rate limit on activation attempts per IP', async () => {
  let last;
  for (let i = 0; i < 31; i++) last = await activate(`BAD-KEY-${1000 + i}`, 'device-aaaa-1111');
  assert.equal(last.status, 429);
});

test('input validation, bad JSON, huge body, unknown route, CORS', async () => {
  assert.equal((await activate('x', 'device-aaaa-1111')).status, 400);
  assert.equal((await activate('GOOD-KEY-1234', 'bad id!')).status, 400);
  assert.equal((await call('POST', '/license/activate', '{not json')).status, 400);
  assert.equal((await call('POST', '/license/activate', JSON.stringify({ key: 'a'.repeat(20000) }))).status, 413);
  assert.equal((await call('GET', '/nope')).status, 404);
  const evil = await call('POST', '/license/activate', { key: 'GOOD-KEY-1234', deviceId: 'device-aaaa-1111' }, { Origin: 'https://evil.example' });
  assert.equal(evil.headers.get('access-control-allow-origin'), null);
  assert.equal((await call('GET', '/health')).status, 200);
});

test('missing config gives clear errors instead of crashing', async () => {
  delete env.LICENSE_SIGNING_JWK;
  const r = await activate('GOOD-KEY-1234', 'device-aaaa-1111');
  assert.equal(r.status, 500); assert.equal(r.body.error, 'not_configured');
  delete env.DB;
  assert.equal((await call('GET', '/health')).body.error, 'not_configured');
});

test('computeTimes converts local Taiwan times to UTC and handles midnight wrap', () => {
  const t = computeTimes({ breakfast: '08:00', lunch: '12:30', dinner: '07:00', water: false }, 480);
  assert.deepEqual(t.map(x => [x.kind, x.utc_min, x.label]), [
    ['breakfast', 0, '08:00'], ['lunch', 270, '12:30'], ['dinner', 1380, '07:00']]);
  const w = computeTimes({ meals: false, water_start: '08:00', water_end: '22:00', water_interval: 90 }, 480);
  assert.equal(w.length, 10);
  assert.ok(computeTimes({ breakfast: 'garbage', water: false }, 'x').length === 3, 'bad input falls back to defaults');
  assert.equal(computeTimes({ meals: false, water_start: '22:00', water_end: '08:00' }, 0).length, 0);
});

test('push: subscribe with token, cron sends at the right minute, 410 removes subscription', async () => {
  const a = await activate('GOOD-KEY-1234', 'device-aaaa-1111');
  const sub = { endpoint: 'https://push.example/abc', keys: { p256dh: SUB_P256DH, auth: SUB_AUTH } };
  assert.equal((await call('POST', '/push/subscribe', { token: 'garbage', subscription: sub, schedule: {}, tzOffset: 480 })).status, 401);
  const s = await call('POST', '/push/subscribe', { token: a.body.token, subscription: sub, schedule: { water: false }, tzOffset: 480 });
  assert.equal(s.status, 200); assert.equal(s.body.reminders, 3);
  // 08:00 Taiwan = 00:00 UTC
  let r = await runDue(env, new Date('2026-12-01T00:00:00Z'));
  assert.equal(r.sent, 1); assert.deepEqual(pushLog, ['https://push.example/abc']);
  r = await runDue(env, new Date('2026-12-01T00:01:00Z'));
  assert.equal(r.sent, 0);
  pushStatus['https://push.example/abc'] = 410;
  r = await runDue(env, new Date('2026-12-01T04:00:00Z')); // 12:00 Taiwan
  assert.equal(r.gone, 1);
  assert.equal(env.DB._db.prepare('SELECT COUNT(*) n FROM push_subs').get().n, 0);
});

test('push: expired license stops pushes', async () => {
  const a = await activate('GOOD-KEY-1234', 'device-aaaa-1111');
  await call('POST', '/push/subscribe', { token: a.body.token, subscription: { endpoint: 'https://push.example/x', keys: { p256dh: SUB_P256DH, auth: SUB_AUTH } }, schedule: { water: false }, tzOffset: 480 });
  env.DB._db.exec('UPDATE push_subs SET license_exp = 1');
  const r = await runDue(env, new Date('2026-12-01T00:00:00Z'));
  assert.equal(r.sent, 0); assert.equal(r.expired, 1);
});

test('push: overflow beyond MAX_PUSH_PER_RUN is queued and sent next minute, not lost', async () => {
  env.MAX_PUSH_PER_RUN = '2';
  const a = await activate('GOOD-KEY-1234', 'device-aaaa-1111');
  for (let i = 0; i < 5; i++) {
    await call('POST', '/push/subscribe', { token: a.body.token, subscription: { endpoint: `https://push.example/u${i}`, keys: { p256dh: SUB_P256DH, auth: SUB_AUTH } }, schedule: { water: false }, tzOffset: 480 });
  }
  let r = await runDue(env, new Date('2026-12-01T00:00:00Z'));
  assert.equal(r.sent, 2); assert.equal(r.queued, 3);
  r = await runDue(env, new Date('2026-12-01T00:01:00Z')); assert.equal(r.sent, 2);
  r = await runDue(env, new Date('2026-12-01T00:02:00Z')); assert.equal(r.sent, 1);
  assert.equal(new Set(pushLog).size, 5, 'everyone got exactly one');
  assert.equal(pushLog.length, 5);
});

test('push: re-subscribing with the same schedule does not rewrite time rows', async () => {
  const a = await activate('GOOD-KEY-1234', 'device-aaaa-1111');
  const body = { token: a.body.token, subscription: { endpoint: 'https://push.example/z', keys: { p256dh: SUB_P256DH, auth: SUB_AUTH } }, schedule: { water: false }, tzOffset: 480 };
  await call('POST', '/push/subscribe', body);
  env.DB._db.exec("UPDATE push_times SET label = 'marker'");
  await call('POST', '/push/subscribe', body);
  assert.equal(env.DB._db.prepare("SELECT COUNT(*) n FROM push_times WHERE label = 'marker'").get().n, 3);
});

test('secrets pasted with quotes/escapes are still accepted', async () => {
  const { parseJsonSecret } = await import('../src/util.js');
  const raw = JSON.stringify(LIC.jwk);
  for (const v of [raw, `"${raw.replace(/"/g, '\\"')}"`, `'${raw}'`, JSON.stringify(raw), `  ${raw}\n`]) {
    assert.equal(parseJsonSecret(v)?.d, LIC.jwk.d, v.slice(0, 20));
  }
  env.LICENSE_SIGNING_JWK = JSON.stringify(raw);
  assert.equal((await activate('GOOD-KEY-1234', 'device-aaaa-1111')).status, 200);
  env.LICENSE_SIGNING_JWK = 'not json';
  assert.equal((await activate('GOOD-KEY-1234', 'device-aaaa-1111')).body.error, 'not_configured');
});
