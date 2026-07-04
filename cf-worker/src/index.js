// NutriMate Push Notification Worker
// Sends Web Push notifications at scheduled times using VAPID

const enc = new TextEncoder();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function b64url(buf) {
  if (typeof buf === 'string') buf = enc.encode(buf);
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function unb64url(str) {
  return Uint8Array.from(
    atob(str.replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  );
}

function concat(...arrays) {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let i = 0;
  for (const a of arrays) { out.set(a, i); i += a.length; }
  return out;
}

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

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
async function sendPush(subscription, payload, env) {
  const { endpoint, keys: { p256dh, auth } } = subscription;
  const privKeyJwk = JSON.parse(env.VAPID_PRIVATE_KEY_JWK);
  const jwt  = await makeVapidJwt(endpoint, env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, privKeyJwk);
  const body = await encryptPayload(JSON.stringify(payload), p256dh, auth);

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '60',
      'Authorization': `vapid t=${jwt},k=${env.VAPID_PUBLIC_KEY}`,
    },
    body,
  });

  if (resp.status === 410 || resp.status === 404) {
    await env.SUBSCRIPTIONS.delete('user_main');
  }
}

// ─── Notification schedule check ─────────────────────────────────────────────
async function checkAndNotify(env) {
  const data = await env.SUBSCRIPTIONS.get('user_main', { type: 'json' });
  if (!data?.subscription) return;

  const { subscription, schedule, tzOffset } = data;
  const local   = new Date(Date.now() + (tzOffset || 0) * 60000);
  const h       = local.getUTCHours();
  const m       = local.getUTCMinutes();
  const hhmm    = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  const nowMins = h * 60 + m;

  const notifs = [];

  if (schedule.meals !== false) {
    for (const [key, emoji, label, time] of [
      ['breakfast', '🌅', '早餐', schedule.breakfast || '08:00'],
      ['lunch',     '☀️',  '午餐', schedule.lunch     || '12:00'],
      ['dinner',    '🌙', '晚餐', schedule.dinner    || '18:00'],
    ]) {
      if (hhmm === time) {
        notifs.push({ title: `${emoji} 記錄${label}`, body: `現在 ${time}，記得記錄今天的${label}！`, tag: `meal-${key}` });
      }
    }
  }

  if (schedule.water !== false) {
    const [sh, sm] = (schedule.water_start || '08:00').split(':').map(Number);
    const [eh, em] = (schedule.water_end   || '22:00').split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins   = eh * 60 + em;
    const interval  = Number(schedule.water_interval) || 90;
    if (nowMins >= startMins && nowMins < endMins && (nowMins - startMins) % interval === 0) {
      notifs.push({ title: '💧 喝水提醒', body: '記得補充水分，保持健康！', tag: `water-${hhmm}` });
    }
  }

  await Promise.all(notifs.map(n => sendPush(subscription, n, env).catch(console.error)));
}

// ─── Worker entry ─────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return jsonResp(null);
    const { pathname } = new URL(request.url);

    if (pathname === '/vapid-public-key') {
      return jsonResp({ key: env.VAPID_PUBLIC_KEY });
    }

    if (pathname === '/subscribe' && request.method === 'POST') {
      const body = await request.json();
      await env.SUBSCRIPTIONS.put('user_main', JSON.stringify(body));
      return jsonResp({ ok: true });
    }

    return jsonResp({ error: 'not found' }, 404);
  },

  async scheduled(_event, env) {
    await checkAndNotify(env);
  },
};
