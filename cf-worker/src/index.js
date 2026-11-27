// NutriMate API worker: Pro license activation + Web Push reminders.
//
// Public routes (CORS limited to ALLOWED_ORIGINS):
//   GET  /health
//   GET  /vapid-public-key
//   POST /license/activate     {key, deviceId, deviceLabel}
//   POST /license/refresh      {key, deviceId}
//   POST /license/deactivate   {key, deviceId}
//   POST /push/subscribe       {token, subscription, schedule, tzOffset}
//   POST /push/unsubscribe     {endpoint}
// Admin routes (Authorization: Bearer ADMIN_TOKEN):
//   POST /admin/create-keys    {count, note}
//   POST /admin/info           {key}
//   POST /admin/reset-devices  {key}
//   POST /admin/revoke         {key}
//   POST /admin/restore        {key}

import { HttpError, corsHeaders, json, readJson, safeEqual } from './util.js';
import * as license from './license.js';
import * as push from './push.js';

const ROUTES = {
  'POST /license/activate':    (req, env, b) => license.activate(req, env, b),
  'POST /license/refresh':     (req, env, b) => license.activate(req, env, b),
  'POST /license/deactivate':  (req, env, b) => license.deactivate(req, env, b),
  'POST /push/subscribe':      (req, env, b) => push.subscribe(env, b),
  'POST /push/unsubscribe':    (req, env, b) => push.unsubscribe(env, b),
};

const ADMIN_ROUTES = {
  'POST /admin/create-keys':   (env, b) => license.adminCreateManual(env, b),
  'POST /admin/info':          (env, b) => license.adminInfo(env, b),
  'POST /admin/reset-devices': (env, b) => license.adminResetDevices(env, b),
  'POST /admin/revoke':        (env, b) => license.adminRevoke(env, b),
  'POST /admin/restore':       (env, b) => license.adminRestore(env, b),
};

async function handle(request, env) {
  const url = new URL(request.url);
  const isAdmin = url.pathname.startsWith('/admin/');
  const cors = corsHeaders(request, env, { anyOrigin: isAdmin });

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  try {
    if (!env.DB) throw new HttpError(500, 'not_configured', '伺服器尚未連接資料庫（D1）');
    const route = `${request.method} ${url.pathname}`;

    if (route === 'GET /health') return json({ ok: true, time: new Date().toISOString() }, 200, cors);
    if (route === 'GET /vapid-public-key') {
      if (!env.VAPID_PUBLIC_KEY) throw new HttpError(503, 'push_not_configured', '推播尚未設定');
      return json({ key: env.VAPID_PUBLIC_KEY }, 200, cors);
    }

    if (isAdmin) {
      const fn = ADMIN_ROUTES[route];
      if (!fn) throw new HttpError(404, 'not_found', 'not found');
      const auth = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
      if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 16 || !safeEqual(auth, env.ADMIN_TOKEN)) {
        throw new HttpError(401, 'unauthorized', '管理密碼錯誤');
      }
      return json(await fn(env, await readJson(request)), 200, cors);
    }

    const fn = ROUTES[route];
    if (!fn) throw new HttpError(404, 'not_found', 'not found');
    return json(await fn(request, env, await readJson(request)), 200, cors);
  } catch (e) {
    if (e instanceof HttpError) return json({ ok: false, error: e.code, message: e.message }, e.status, cors);
    console.error('unhandled', e?.stack || e);
    return json({ ok: false, error: 'server_error', message: '伺服器發生錯誤，請稍後再試' }, 500, cors);
  }
}

export default {
  fetch: handle,
  async scheduled(event, env, ctx) {
    ctx.waitUntil(push.runDue(env, new Date(event.scheduledTime)).then(r => console.log('cron', JSON.stringify(r))));
  },
};
