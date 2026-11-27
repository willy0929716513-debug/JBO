// ── NutriMate configuration ─────────────────────────────────────────────────
// This is the ONLY file you need to edit after deploying the worker.
// Nothing in here is secret (the public key can only VERIFY licenses, not create them).

window.NM_CONFIG = {
  // Cloudflare Worker URL, e.g. 'https://nutrimate-api.yourname.workers.dev' (no trailing slash).
  // Leave empty until deployed: Pro purchase is hidden and the free app keeps working.
  WORKER_URL: '',

  // Public half of the license signing key (printed by cf-worker/tools/gen-keys.mjs).
  LICENSE_PUBLIC_JWK: null,

  // Where people buy Pro (your Gumroad product page).
  BUY_URL: '',

  // Shown in error messages and the purchase screen.
  SUPPORT_EMAIL: '',

  PRICE_LABEL: 'NT$290 一次買斷',

  // Which features need Pro. Remove an item to make it free again.
  PRO_FEATURES: {
    ai_scan:      { name: 'AI 拍照辨識熱量', icon: '📸' },
    trends_long:  { name: '30 天長期趨勢',   icon: '📈' },
    workout_plan: { name: '個人化訓練計畫與重訓記錄', icon: '🏋️' },
    apple_watch:  { name: 'Apple Watch 運動匯入', icon: '⌚' },
    push:         { name: '背景推播提醒（App 關閉也會通知）', icon: '🔔' },
  },
};
