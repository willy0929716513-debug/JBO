-- NutriMate API database (Cloudflare D1)
-- Apply with:  wrangler d1 execute nutrimate --remote --file=schema.sql
-- Safe to run more than once.

-- One row per license key. The raw key is never stored, only its SHA-256 hash.
CREATE TABLE IF NOT EXISTS licenses (
  lic_hash         TEXT PRIMARY KEY,
  source           TEXT NOT NULL,              -- 'gumroad' | 'manual'
  status           TEXT NOT NULL DEFAULT 'active', -- 'active' | 'revoked'
  note             TEXT,
  created_at       INTEGER NOT NULL,
  last_verified_at INTEGER
);

-- Devices activated on each license (limit enforced in code).
CREATE TABLE IF NOT EXISTS devices (
  lic_hash     TEXT NOT NULL,
  device_id    TEXT NOT NULL,
  label        TEXT,
  created_at   INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  PRIMARY KEY (lic_hash, device_id)
);

-- Simple fixed-window rate limiting.
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket   TEXT PRIMARY KEY,
  count    INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);

-- Web Push subscriptions (one per browser/device).
CREATE TABLE IF NOT EXISTS push_subs (
  id          TEXT PRIMARY KEY,               -- sha256(endpoint)
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  lic_hash    TEXT,
  device_id   TEXT,
  license_exp INTEGER NOT NULL,               -- push stops after this (unix seconds)
  sched_hash  TEXT,
  updated_at  INTEGER NOT NULL
);

-- Pre-computed fire times, in UTC minutes of the day (0-1439).
CREATE TABLE IF NOT EXISTS push_times (
  sub_id  TEXT NOT NULL,
  utc_min INTEGER NOT NULL,
  kind    TEXT NOT NULL,                      -- breakfast | lunch | dinner | water
  label   TEXT,                               -- local HH:MM shown in the message
  PRIMARY KEY (sub_id, utc_min, kind)
);
CREATE INDEX IF NOT EXISTS idx_push_times_min ON push_times(utc_min);
CREATE INDEX IF NOT EXISTS idx_push_subs_lic  ON push_subs(lic_hash);

-- Overflow queue: Cloudflare's free plan allows ~50 outgoing requests per cron run,
-- so pushes beyond MAX_PUSH_PER_RUN wait here for the next minute instead of being lost.
CREATE TABLE IF NOT EXISTS push_queue (
  sub_id     TEXT NOT NULL,
  kind       TEXT NOT NULL,
  label      TEXT,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (sub_id, kind, label)
);
