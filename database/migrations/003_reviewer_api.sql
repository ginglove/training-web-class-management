-- ================================================================
-- Migration: SRS 19.6 Reviewer API Support
-- ================================================================

-- 1. Add missing columns to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS claimed_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewer_note_internal TEXT;

-- 2. booking_comments table (threaded comments per booking)
CREATE TABLE IF NOT EXISTS booking_comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  content     TEXT NOT NULL CHECK (char_length(content) >= 1),
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_comments_booking ON booking_comments(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_comments_author  ON booking_comments(author_id);

-- Trigger: auto-update updated_at on booking_comments
CREATE TRIGGER trg_booking_comments_updated_at
  BEFORE UPDATE ON booking_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
