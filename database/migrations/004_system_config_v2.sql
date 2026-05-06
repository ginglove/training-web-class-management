-- Add Email Verification and Self Registration settings to system_config
INSERT INTO system_config (key, value, description) VALUES
  ('require_email_verification', 'true', 'Require email confirmation before account activation'),
  ('allow_self_registration',   'true', 'Allow users to register themselves')
ON CONFLICT (key) DO NOTHING;
