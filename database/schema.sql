-- =============================================================
-- CLASS BOOKING MANAGEMENT SYSTEM
-- Database Schema v3.1 (Fixed — aligned with backend code)
-- PostgreSQL 15+
-- =============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'APPROVER', 'REVIEWER', 'CREATOR');

CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED');

CREATE TYPE class_status AS ENUM ('AVAILABLE', 'MAINTENANCE', 'CLOSED');

CREATE TYPE block_type AS ENUM ('MAINTENANCE', 'HOLIDAY', 'EVENT', 'OTHER');

CREATE TYPE booking_status AS ENUM (
  'DRAFT',
  'PENDING_REVIEW',
  'IN_REVIEW',
  'FORWARDED',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'CANCELLED'
);

CREATE TYPE notification_type AS ENUM (
  'BOOKING_SUBMITTED',
  'BOOKING_CLAIMED',
  'BOOKING_FORWARDED',
  'BOOKING_APPROVED',
  'BOOKING_REJECTED',
  'BOOKING_CANCELLED',
  'SYSTEM'
);

-- =============================================================
-- TABLES
-- =============================================================

-- -------------------------------------------------------------
-- USERS
-- Added: username, status (ACTIVE/INACTIVE/LOCKED)
-- Removed: is_active (replaced by status enum)
-- -------------------------------------------------------------
CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email               VARCHAR(255) NOT NULL UNIQUE,
  username            VARCHAR(100) NOT NULL UNIQUE,
  password_hash       VARCHAR(255) NOT NULL,
  full_name           VARCHAR(255) NOT NULL,
  role                user_role NOT NULL DEFAULT 'CREATOR',
  status              user_status NOT NULL DEFAULT 'ACTIVE',
  email_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  phone               VARCHAR(20),
  internal_notes      TEXT,
  department          VARCHAR(100),
  avatar_url          VARCHAR(500),
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  failed_login_count  INTEGER NOT NULL DEFAULT 0,
  locked_until        TIMESTAMPTZ,
  last_login_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role     ON users(role);
CREATE INDEX idx_users_status   ON users(status);

-- -------------------------------------------------------------
-- CLASSES (Rooms)
-- Added: status enum (AVAILABLE/MAINTENANCE/CLOSED)
-- Removed: is_active (replaced by status)
-- -------------------------------------------------------------
CREATE TABLE classes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  location    VARCHAR(255) NOT NULL,
  capacity    INTEGER NOT NULL CHECK (capacity > 0),
  description TEXT,
  equipment   JSONB NOT NULL DEFAULT '{}',
  status      class_status NOT NULL DEFAULT 'AVAILABLE',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_classes_status ON classes(status);

-- -------------------------------------------------------------
-- TIME SLOTS
-- 4 fixed slots per day as defined in SRS
-- -------------------------------------------------------------
CREATE TABLE time_slots (
  id         SERIAL PRIMARY KEY,
  slot_name  VARCHAR(50) NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- -------------------------------------------------------------
-- BOOKINGS
-- Uses date + slot_id (NOT start_datetime)
-- Added: reviewer_note, approver_note, rejection_reason
-- -------------------------------------------------------------
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  class_id        UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  date            DATE NOT NULL,
  slot_id         INTEGER NOT NULL REFERENCES time_slots(id) ON DELETE RESTRICT,
  purpose         TEXT NOT NULL,
  course_name     VARCHAR(255),
  attendee_count  INTEGER NOT NULL CHECK (attendee_count > 0),
  status          booking_status NOT NULL DEFAULT 'DRAFT',
  reviewer_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  approver_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewer_note   TEXT,
  reviewer_note_internal TEXT,              -- is_internal note (hidden from Creator)
  approver_note   TEXT,
  rejection_reason TEXT,
  submitted_at    TIMESTAMPTZ,
  claimed_at      TIMESTAMPTZ,             -- when reviewer claimed this booking
  approved_at     TIMESTAMPTZ,
  rejected_at     TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_creator    ON bookings(creator_id);
CREATE INDEX idx_bookings_class_date ON bookings(class_id, date);
CREATE INDEX idx_bookings_status     ON bookings(status);
CREATE INDEX idx_bookings_reviewer   ON bookings(reviewer_id);
CREATE INDEX idx_bookings_date       ON bookings(date);

-- Prevent double-booking: unique constraint on (class, date, slot) for active bookings
CREATE UNIQUE INDEX idx_bookings_no_conflict
  ON bookings(class_id, date, slot_id)
  WHERE status NOT IN ('CANCELLED', 'REJECTED');

-- -------------------------------------------------------------
-- BOOKING LOGS (Audit trail — replaces calendar_blocks)
-- -------------------------------------------------------------
CREATE TABLE booking_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  actor_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  from_status booking_status,
  to_status   booking_status NOT NULL,
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booking_logs_booking ON booking_logs(booking_id);
CREATE INDEX idx_booking_logs_actor   ON booking_logs(actor_id);

-- -------------------------------------------------------------
-- BOOKING COMMENTS (threaded per-booking — SRS 19.6)
-- -------------------------------------------------------------
CREATE TABLE booking_comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  content     TEXT NOT NULL CHECK (char_length(content) >= 1),
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,  -- hidden from CREATOR if TRUE
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booking_comments_booking ON booking_comments(booking_id);
CREATE INDEX idx_booking_comments_author  ON booking_comments(author_id);

-- -------------------------------------------------------------
-- NOTIFICATIONS
-- -------------------------------------------------------------
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id  UUID REFERENCES bookings(id) ON DELETE SET NULL,
  type        notification_type NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user    ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_booking ON notifications(booking_id);

-- -------------------------------------------------------------
-- REFRESH TOKENS
-- -------------------------------------------------------------
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);



-- -------------------------------------------------------------
-- EMAIL VERIFICATION TOKENS
-- -------------------------------------------------------------
CREATE TABLE email_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) NOT NULL UNIQUE,
  type       VARCHAR(50) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_tokens_token ON email_tokens(token);
CREATE INDEX idx_email_tokens_user  ON email_tokens(user_id);

-- -------------------------------------------------------------
-- MANUAL CALENDAR BLOCKS (Admin)
-- -------------------------------------------------------------
CREATE TABLE manual_calendar_blocks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id        UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  block_type      block_type NOT NULL,
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  start_datetime  TIMESTAMPTZ NOT NULL,
  end_datetime    TIMESTAMPTZ NOT NULL,
  is_all_day      BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_rule VARCHAR(200),
  color           VARCHAR(7),
  affected_bookings UUID[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  CHECK (end_datetime > start_datetime)
);

CREATE INDEX idx_manual_blocks_class ON manual_calendar_blocks(class_id);
CREATE INDEX idx_manual_blocks_time  ON manual_calendar_blocks(start_datetime, end_datetime);

-- -------------------------------------------------------------
-- SYSTEM CONFIGURATION
-- -------------------------------------------------------------
CREATE TABLE system_config (
  key         VARCHAR(100) PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Validate attendee_count does not exceed room capacity
CREATE OR REPLACE FUNCTION check_booking_capacity()
RETURNS TRIGGER AS $$
DECLARE
  room_capacity INTEGER;
BEGIN
  SELECT capacity INTO room_capacity
  FROM classes WHERE id = NEW.class_id;

  IF NEW.attendee_count > room_capacity THEN
    RAISE EXCEPTION 'Attendee count (%) exceeds room capacity (%)',
      NEW.attendee_count, room_capacity;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_capacity_check
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION check_booking_capacity();

-- =============================================================
-- VIEWS
-- =============================================================

-- Booking summary view with all related info
CREATE OR REPLACE VIEW booking_summary AS
SELECT
  b.id,
  b.date,
  b.status,
  b.purpose,
  b.course_name,
  b.attendee_count,
  b.reviewer_note,
  b.approver_note,
  b.rejection_reason,
  b.created_at,
  b.submitted_at,
  b.approved_at,
  b.rejected_at,
  b.cancelled_at,
  b.creator_id,
  b.reviewer_id,
  b.approver_id,
  b.class_id,
  b.slot_id,
  -- Creator
  u_creator.full_name   AS creator_name,
  u_creator.email       AS creator_email,
  u_creator.department  AS creator_department,
  -- Room
  c.name                AS class_name,
  c.location            AS class_location,
  c.capacity            AS class_capacity,
  c.status              AS class_status,
  -- Slot
  ts.slot_name,
  ts.start_time,
  ts.end_time,
  -- Reviewer
  u_reviewer.full_name  AS reviewer_name,
  -- Approver
  u_approver.full_name  AS approver_name
FROM bookings b
JOIN users u_creator       ON b.creator_id  = u_creator.id
JOIN classes c             ON b.class_id    = c.id
JOIN time_slots ts         ON b.slot_id     = ts.id
LEFT JOIN users u_reviewer ON b.reviewer_id = u_reviewer.id
LEFT JOIN users u_approver ON b.approver_id = u_approver.id;

-- Room availability view
CREATE OR REPLACE VIEW room_slot_usage AS
SELECT
  c.id        AS class_id,
  c.name      AS class_name,
  c.location,
  c.capacity,
  c.status    AS class_status,
  ts.id       AS slot_id,
  ts.slot_name,
  ts.start_time,
  ts.end_time,
  b.id        AS booking_id,
  b.status    AS booking_status,
  b.date,
  u.full_name AS booked_by
FROM classes c
CROSS JOIN time_slots ts
LEFT JOIN bookings b ON b.class_id = c.id
  AND b.slot_id = ts.id
  AND b.status NOT IN ('CANCELLED', 'REJECTED')
LEFT JOIN users u ON b.creator_id = u.id
WHERE c.status = 'AVAILABLE';
