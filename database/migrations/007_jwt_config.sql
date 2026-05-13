-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 007: Add JWT token lifetime settings to system_config
-- Run on existing databases that were seeded before this setting was added.
-- Safe to run multiple times (INSERT ... ON CONFLICT DO NOTHING).
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO system_config (key, value, description)
VALUES
  (
    'jwt_expires_in',
    '15m',
    'Access token lifetime (e.g. 15m, 1h, 8h). Changes take effect within 30 seconds.'
  ),
  (
    'refresh_expires_days',
    '7',
    'Refresh token lifetime in days'
  )
ON CONFLICT (key) DO NOTHING;
