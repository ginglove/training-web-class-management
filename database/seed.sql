-- =============================================================
-- SEED DATA — Class Booking Management System
-- All passwords are: Password@123 (bcrypt hashed)
-- =============================================================

-- Time Slots (4 slots per SRS)
INSERT INTO time_slots (slot_name, start_time, end_time, sort_order) VALUES
  ('Slot 1 – Morning',   '07:30', '09:30', 1),
  ('Slot 2 – Mid Morning','09:45','11:45', 2),
  ('Slot 3 – Afternoon', '13:00', '15:00', 3),
  ('Slot 4 – Late Afternoon','15:15','17:15', 4);

-- Users (password: Password@123)
-- bcrypt hash of 'Password@123' with 12 rounds
INSERT INTO users (id, email, password_hash, full_name, role, is_active, email_verified, department) VALUES
  ('11111111-0000-0000-0000-000000000001', 'admin@training.vn',      '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfHCNxMoTDOyq7EXUWmGbfW', 'System Admin',      'ADMIN',    true, true, 'IT'),
  ('22222222-0000-0000-0000-000000000001', 'approver1@training.vn',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfHCNxMoTDOyq7EXUWmGbfW', 'Nguyen Van Approver','APPROVER', true, true, 'Management'),
  ('22222222-0000-0000-0000-000000000002', 'approver2@training.vn',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfHCNxMoTDOyq7EXUWmGbfW', 'Tran Thi Approver', 'APPROVER', true, true, 'Management'),
  ('33333333-0000-0000-0000-000000000001', 'reviewer1@training.vn',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfHCNxMoTDOyq7EXUWmGbfW', 'Le Van Reviewer',   'REVIEWER', true, true, 'Academic'),
  ('33333333-0000-0000-0000-000000000002', 'reviewer2@training.vn',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfHCNxMoTDOyq7EXUWmGbfW', 'Pham Thi Reviewer', 'REVIEWER', true, true, 'Academic'),
  ('33333333-0000-0000-0000-000000000003', 'reviewer3@training.vn',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfHCNxMoTDOyq7EXUWmGbfW', 'Hoang Van Reviewer','REVIEWER', true, true, 'Academic'),
  ('44444444-0000-0000-0000-000000000001', 'creator1@training.vn',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfHCNxMoTDOyq7EXUWmGbfW', 'Do Thi Creator',    'CREATOR',  true, true, 'Development'),
  ('44444444-0000-0000-0000-000000000002', 'creator2@training.vn',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfHCNxMoTDOyq7EXUWmGbfW', 'Vu Van Creator',    'CREATOR',  true, true, 'Development'),
  ('44444444-0000-0000-0000-000000000003', 'creator3@training.vn',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfHCNxMoTDOyq7EXUWmGbfW', 'Bui Thi Creator',   'CREATOR',  true, true, 'QA'),
  ('44444444-0000-0000-0000-000000000004', 'creator4@training.vn',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfHCNxMoTDOyq7EXUWmGbfW', 'Dang Van Creator',  'CREATOR',  false, true, 'QA');

-- Classrooms
INSERT INTO classes (id, name, location, capacity, description, equipment) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Room A101', 'Building A - Floor 1', 30,
   'Main testing lab with individual workstations',
   '{"projector": true, "whiteboard": true, "ac": true, "computers": 30, "network": "100Mbps"}'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Room B205', 'Building B - Floor 2', 20,
   'Mid-size seminar room',
   '{"projector": true, "whiteboard": true, "ac": true, "computers": 20, "network": "100Mbps"}'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Room C301', 'Building C - Floor 3', 15,
   'Small workshop room',
   '{"projector": true, "whiteboard": true, "ac": true, "computers": 15, "network": "50Mbps"}'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'Hall D001', 'Building D - Ground', 60,
   'Large conference hall',
   '{"projector": true, "screen": true, "ac": true, "microphone": true, "computers": 0}'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'Room E102', 'Building E - Floor 1', 25,
   'Automation testing lab',
   '{"projector": true, "whiteboard": true, "ac": true, "computers": 25, "network": "1Gbps", "selenium_grid": true}');

-- System Config
INSERT INTO system_config (key, value, description) VALUES
  ('booking_advance_days', '30', 'Max days ahead a booking can be made'),
  ('booking_min_notice_hours', '24', 'Min hours notice required before booking date'),
  ('max_bookings_per_week_creator', '5', 'Max active bookings a creator can have per week'),
  ('maintenance_mode', 'false', 'System maintenance flag'),
  ('app_name', 'Class Booking System', 'Application display name'),
  ('timezone', 'Asia/Ho_Chi_Minh', 'System timezone');

-- Bookings (various statuses for training)
INSERT INTO bookings (id, creator_id, class_id, date, slot_id, purpose, course_name, attendee_count, status, reviewer_id, approver_id, submitted_at, approved_at) VALUES
  -- APPROVED bookings
  ('bbbbbbbb-0000-0000-0000-000000000001',
   '44444444-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
   CURRENT_DATE + 3, 1, 'Manual Testing Fundamentals training session', 'Manual Testing 101', 25,
   'APPROVED', '33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001',
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),

  ('bbbbbbbb-0000-0000-0000-000000000002',
   '44444444-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002',
   CURRENT_DATE + 5, 2, 'API Testing with Postman workshop', 'API Testing Bootcamp', 18,
   'APPROVED', '33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002',
   NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),

  -- PENDING_REVIEW bookings
  ('bbbbbbbb-0000-0000-0000-000000000003',
   '44444444-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000005',
   CURRENT_DATE + 7, 3, 'Selenium WebDriver automation lab', 'Test Automation Level 1', 20,
   'PENDING_REVIEW', NULL, NULL,
   NOW() - INTERVAL '1 hour', NULL),

  ('bbbbbbbb-0000-0000-0000-000000000004',
   '44444444-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000003',
   CURRENT_DATE + 4, 1, 'Performance testing intro with JMeter', 'Performance Testing 101', 12,
   'PENDING_REVIEW', NULL, NULL,
   NOW() - INTERVAL '2 hours', NULL),

  -- IN_REVIEW bookings
  ('bbbbbbbb-0000-0000-0000-000000000005',
   '44444444-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001',
   CURRENT_DATE + 10, 4, 'Security testing methodologies overview', 'Security Testing Basics', 28,
   'IN_REVIEW', '33333333-0000-0000-0000-000000000003', NULL,
   NOW() - INTERVAL '6 hours', NULL),

  -- PENDING_APPROVAL bookings
  ('bbbbbbbb-0000-0000-0000-000000000006',
   '44444444-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000002',
   CURRENT_DATE + 8, 2, 'Mobile testing on Android emulators', 'Mobile Testing Fundamentals', 15,
   'PENDING_APPROVAL', '33333333-0000-0000-0000-000000000001', NULL,
   NOW() - INTERVAL '2 days', NULL),

  -- REJECTED bookings
  ('bbbbbbbb-0000-0000-0000-000000000007',
   '44444444-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000004',
   CURRENT_DATE + 2, 1, 'Test planning session', 'Test Management', 55,
   'REJECTED', '33333333-0000-0000-0000-000000000002', NULL,
   NOW() - INTERVAL '4 days', NULL),

  -- DRAFT booking
  ('bbbbbbbb-0000-0000-0000-000000000008',
   '44444444-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000003',
   CURRENT_DATE + 14, 1, 'BDD with Cucumber intro', 'BDD Testing', 10,
   'DRAFT', NULL, NULL, NULL, NULL),

  -- CANCELLED booking
  ('bbbbbbbb-0000-0000-0000-000000000009',
   '44444444-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001',
   CURRENT_DATE + 1, 2, 'Test case design techniques', 'Test Design Masterclass', 22,
   'CANCELLED', NULL, NULL,
   NOW() - INTERVAL '3 days', NULL);

-- Booking Logs (audit trail)
INSERT INTO booking_logs (booking_id, actor_id, from_status, to_status, comment) VALUES
  -- Booking 1 full trail
  ('bbbbbbbb-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 'DRAFT', 'PENDING_REVIEW', 'Submitted for review'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'PENDING_REVIEW', 'IN_REVIEW', 'Claimed by reviewer'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'IN_REVIEW', 'PENDING_APPROVAL', 'All checks passed, forwarding to approver'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'PENDING_APPROVAL', 'APPROVED', 'Approved. Room confirmed.'),
  -- Booking 3
  ('bbbbbbbb-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000001', 'DRAFT', 'PENDING_REVIEW', 'Ready for review'),
  -- Booking 5
  ('bbbbbbbb-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000002', 'DRAFT', 'PENDING_REVIEW', 'Submitted'),
  ('bbbbbbbb-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000003', 'PENDING_REVIEW', 'IN_REVIEW', 'Under review'),
  -- Booking 6
  ('bbbbbbbb-0000-0000-0000-000000000006', '44444444-0000-0000-0000-000000000003', 'DRAFT', 'PENDING_REVIEW', 'Submitted'),
  ('bbbbbbbb-0000-0000-0000-000000000006', '33333333-0000-0000-0000-000000000001', 'PENDING_REVIEW', 'IN_REVIEW', 'Claimed'),
  ('bbbbbbbb-0000-0000-0000-000000000006', '33333333-0000-0000-0000-000000000001', 'IN_REVIEW', 'PENDING_APPROVAL', 'Verified and forwarded'),
  -- Booking 7 (rejected)
  ('bbbbbbbb-0000-0000-0000-000000000007', '44444444-0000-0000-0000-000000000004', 'DRAFT', 'PENDING_REVIEW', 'Submitted'),
  ('bbbbbbbb-0000-0000-0000-000000000007', '33333333-0000-0000-0000-000000000002', 'PENDING_REVIEW', 'IN_REVIEW', 'Claimed'),
  ('bbbbbbbb-0000-0000-0000-000000000007', '33333333-0000-0000-0000-000000000002', 'IN_REVIEW', 'REJECTED', 'Hall D001 requires special setup. Please resubmit with 48h notice.'),
  -- Booking 9 (cancelled)
  ('bbbbbbbb-0000-0000-0000-000000000009', '44444444-0000-0000-0000-000000000002', 'DRAFT', 'PENDING_REVIEW', 'Submitted'),
  ('bbbbbbbb-0000-0000-0000-000000000009', '44444444-0000-0000-0000-000000000002', 'PENDING_REVIEW', 'CANCELLED', 'Trainer unavailable, cancelling.');

-- Notifications
INSERT INTO notifications (user_id, booking_id, type, title, message) VALUES
  ('33333333-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000003',
   'BOOKING_SUBMITTED', 'New Booking Awaiting Review',
   'A new booking request "Selenium WebDriver automation lab" needs your review.'),
  ('33333333-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000004',
   'BOOKING_SUBMITTED', 'New Booking Awaiting Review',
   'A new booking "Performance testing intro with JMeter" has been submitted.'),
  ('22222222-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000006',
   'BOOKING_FORWARDED', 'Booking Ready for Approval',
   'Booking "Mobile testing on Android emulators" has been reviewed and needs your approval.'),
  ('44444444-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001',
   'BOOKING_APPROVED', 'Your Booking was Approved!',
   'Great news! Your booking for Room A101 on the upcoming date has been approved.'),
  ('44444444-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000007',
   'BOOKING_REJECTED', 'Booking Rejected',
   'Your booking for Hall D001 was rejected. Reason: Requires 48h advance notice.');
