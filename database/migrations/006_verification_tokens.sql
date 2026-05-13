-- -------------------------------------------------------------
-- VERIFICATION TOKENS
-- TTL: 24 hours
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS verification_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       UUID NOT NULL DEFAULT uuid_generate_v4(),
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX idx_verification_tokens_user  ON verification_tokens(user_id);
