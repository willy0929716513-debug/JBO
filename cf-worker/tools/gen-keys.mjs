#!/usr/bin/env node
// Generates every secret NutriMate Pro needs, ONCE.
//   node tools/gen-keys.mjs
// Writes ./secrets.local.json (git-ignored). Keep a copy somewhere safe (password manager).
// If you lose LICENSE_SIGNING_JWK you can make a new one, but every customer
// will have to re-activate (their key still works; the app just asks again).

import { webcrypto as crypto } from 'node:crypto';
import { writeFileSync, existsSync } from 'node:fs';

const OUT = new URL('../secrets.local.json', import.meta.url);
if (existsSync(OUT) && !process.argv.includes('--force')) {
  console.error('secrets.local.json already exists. Refusing to overwrite (use --force if you really mean it).');
  process.exit(1);
}

const b64url = buf => Buffer.from(buf).toString('base64url');

async function ecPair() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const priv = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const pubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  return { priv, pubRaw };
}

const lic = await ecPair();
const vapid = await ecPair();

const secrets = {
  LICENSE_SIGNING_JWK: JSON.stringify({ kty: 'EC', crv: 'P-256', x: lic.priv.x, y: lic.priv.y, d: lic.priv.d }),
  LICENSE_PUBLIC_JWK_FOR_APP: { kty: 'EC', crv: 'P-256', x: lic.priv.x, y: lic.priv.y },
  ADMIN_TOKEN: b64url(crypto.getRandomValues(new Uint8Array(24))),
  VAPID_PUBLIC_KEY: b64url(vapid.pubRaw),
  VAPID_PRIVATE_KEY_JWK: JSON.stringify({ kty: 'EC', crv: 'P-256', x: vapid.priv.x, y: vapid.priv.y, d: vapid.priv.d }),
};

writeFileSync(OUT, JSON.stringify(secrets, null, 2) + '\n', { mode: 0o600 });

console.log('✅ Saved to cf-worker/secrets.local.json (do NOT commit this file)\n');
console.log('Next:');
console.log('  1) wrangler secret put LICENSE_SIGNING_JWK      ← paste LICENSE_SIGNING_JWK');
console.log('  2) wrangler secret put ADMIN_TOKEN              ← paste ADMIN_TOKEN');
console.log('  3) wrangler secret put VAPID_PUBLIC_KEY         ← paste VAPID_PUBLIC_KEY');
console.log('  4) wrangler secret put VAPID_PRIVATE_KEY_JWK    ← paste VAPID_PRIVATE_KEY_JWK');
console.log('  5) wrangler secret put VAPID_SUBJECT            ← mailto:you@example.com');
console.log('  6) In docs/js/config.js set LICENSE_PUBLIC_JWK to:');
console.log('     ' + JSON.stringify(secrets.LICENSE_PUBLIC_JWK_FOR_APP));
