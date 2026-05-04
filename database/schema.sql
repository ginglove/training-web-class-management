-- =============================================================
-- CLASS BOOKING MANAGEMENT SYSTEM
-- Database Schema v3.0
-- PostgreSQL 15+
-- =============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'APPROVER', 'REVIEWER', 'CREATOR');

CREATE TYPE booking_status AS ENUM (
  'DRAFT',
  'PENDING_REVIEW',
  'IN_REVIEW',
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
-- -------------------------------------------------------------
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  role          user_role NOT NULL DEFAULT 'CREATOR',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone         VARCHAR(20),
  department    VARCHAR(100),
  avatar_url    VARCHAR(500),
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- -------------------------------------------------------------
-- CLASSES (Rooms)
-- -------------------------------------------------------------
CREATE TABLE classes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  location    VARCHAR(255) NOT NULL,
  capacity    INTEGER NOT NULL CHECK (capacity > 0),
  description TEXT,
  equipment   JSONB NOT NULL DEFAULT '{}',
  -- equipment example: {"projector": true, "whiteboard": true, "ac": true, "computers": 30}
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_classes_active ON classes(is_active);

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
  approver_note   TEXT,
  submitted_at    TIMESTAMPTZ,
  approved_at     TIMESTAMPTZ,
  rejected_at     TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_creator ON bookings(creator_id);
CREATE INDEX idx_bookings_class_date ON bookings(class_id, date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_reviewer ON bookings(reviewer_id);
CREATE INDEX idx_bookings_date ON bookings(date);

-- Prevent double-booking: unique constraint on (class, date, slot) for active bookings
CREATE UNIQUE INDEX idx_bookings_no_conflict
  ON bookings(class_id, date, slot_id)
  WHERE status NOT IN ('CANCELLED', 'REJECTED');

-- -------------------------------------------------------------
-- BOOKING LOGS (Audit trail)
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
CREATE INDEX idx_booking_logs_actor ON booking_logs(actor_id);

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

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
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
  type       VARCHAR(50) NOT NULL, -- 'VERIFY_EMAIL' | 'RESET_PASSWORD' | 'OTP_2FA'
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_tokens_token ON email_tokens(token);
CREATE INDEX idx_email_tokens_user ON email_tokens(user_id);

-- -------------------------------------------------------------
-- SYSTEM CONFIGURATION
-- -------------------------------------------------------------
CREATE TABLE system_config (
  key         VARCHAR(100) PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- AUDIT LOGS (Admin trail)
-- -------------------------------------------------------------
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id   UUID,
  details     JSONB DEFAULT '{}',
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

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
  b.created_at,
  b.submitted_at,
  b.approved_at,
  -- Creator
  u_creator.full_name  AS creator_name,
  u_creator.email      AS creator_email,
  u_creator.department AS creator_department,
  -- Room
  c.name               AS class_name,
  c.location           AS class_location,
  c.capacity           AS class_capacity,
  -- Slot
  ts.slot_name,
  ts.start_time,
  ts.end_time,
  -- Reviewer
  u_reviewer.full_name AS reviewer_name,
  -- Approver
  u_approver.full_name AS approver_name
FROM bookings b
JOIN users u_creator      ON b.creator_id = u_creator.id
JOIN classes c            ON b.class_id   = c.id
JOIN time_slots ts        ON b.slot_id    = ts.id
LEFT JOIN users u_reviewer ON b.reviewer_id = u_reviewer.id
LEFT JOIN users u_approver ON b.approver_id = u_approver.id;

-- Room availability view for a given date (use with WHERE date = '...')
CREATE OR REPLACE VIEW room_slot_usage AS
SELECT
  c.id        AS class_id,
  c.name      AS class_name,
  c.location,
  c.capacity,
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
WHERE c.is_active = TRUE;
