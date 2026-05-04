const pool = require('../db');
const { addLog } = require('../utils/booking-helpers');
const NOTIF_URL = process.env.NOTIF_SERVICE_URL || 'http://localhost:8013';

// Helper: send notification via HTTP to notification-service
async function notify(payload) {
  try {
    await fetch(`${NOTIF_URL}/notifications/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch { /* non-critical */ }
}

// GET /bookings
async function list(req, res, next) {
  try {
    const userId = req.user.sub;
    const role   = req.user.role;
    const { status, date_from, date_to, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = [];
    let params = [];
    let i = 1;

    // Role-based visibility
    if (role === 'CREATOR') {
      where.push(`b.creator_id = $${i++}`); params.push(userId);
    } else if (role === 'REVIEWER') {
      where.push(`(b.reviewer_id = $${i++} OR b.status = 'PENDING_REVIEW')`); params.push(userId);
    } else if (role === 'APPROVER') {
      where.push(`(b.approver_id = $${i++} OR b.status = 'PENDING_APPROVAL')`); params.push(userId);
    }
    // ADMIN sees all

    if (status)    { where.push(`b.status = $${i++}`);     params.push(status); }
    if (date_from) { where.push(`b.date >= $${i++}`);      params.push(date_from); }
    if (date_to)   { where.push(`b.date <= $${i++}`);      params.push(date_to); }

    const whereStr = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT bs.*, COUNT(*) OVER() AS total_count
       FROM booking_summary bs
       JOIN bookings b ON b.id = bs.id
       ${whereStr}
       ORDER BY b.created_at DESC
       LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    );

    const total = rows[0]?.total_count || 0;
    res.json({ data: rows, meta: { total: parseInt(total), page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
}

// GET /bookings/:id
async function getById(req, res, next) {
  try {
    const userId = req.user.sub;
    const role   = req.user.role;
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT * FROM booking_summary WHERE id = $1`, [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Booking not found' });

    // Authorization
    const b = rows[0];
    if (role === 'CREATOR' && b.creator_id !== userId)
      return res.status(403).json({ error: 'Access denied' });

    const { rows: logs } = await pool.query(
      `SELECT bl.*, u.full_name AS actor_name, u.role AS actor_role
       FROM booking_logs bl JOIN users u ON bl.actor_id = u.id
       WHERE bl.booking_id = $1 ORDER BY bl.created_at ASC`, [id]
    );

    res.json({ ...b, logs });
  } catch (err) { next(err); }
}

// POST /bookings
async function create(req, res, next) {
  try {
    const creatorId = req.user.sub;
    const { class_id, date, slot_id, purpose, attendee_count, course_name } = req.body;

    if (!class_id || !date || !slot_id || !purpose || !attendee_count)
      return res.status(400).json({ error: 'Missing required fields' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Get Slot Details for Time Validation
      const { rows: slots } = await client.query("SELECT * FROM time_slots WHERE id = $1", [slot_id]);
      if (!slots.length) return res.status(404).json({ error: 'Invalid time slot' });
      const slot = slots[0];

      // Rule 36: Bookings must be at least 2 hours in advance
      // Combine date and start_time to check against NOW()
      const slotStart = new Date(`${date}T${slot.start_time}`);
      const nowPlus2h = new Date(Date.now() + 2 * 60 * 60 * 1000);
      
      if (slotStart < nowPlus2h) {
        return res.status(422).json({ 
          error: 'ERR_TIME_TOO_SOON', 
          message: 'Bookings must be made at least 2 hours before the slot starts' 
        });
      }

      const { rows: rooms } = await client.query("SELECT status, capacity FROM classes WHERE id = $1", [class_id]);
      if (!rooms.length) return res.status(404).json({ error: 'Room not found' });
      if (rooms[0].status !== 'AVAILABLE')
        return res.status(422).json({ error: 'ERR_CLASS_NOT_AVAILABLE', message: 'Room is not available' });
      
      if (attendee_count > rooms[0].capacity)
        return res.status(422).json({ error: 'ERR_ATTENDEES_EXCEEDED', message: `Max capacity is ${rooms[0].capacity}` });

      // 3. Weekly Quota (Rule 37: 5 active bookings/week)
      const { rows: countRows } = await client.query(
        "SELECT COUNT(*) FROM bookings WHERE creator_id = $1 AND status NOT IN ('REJECTED', 'CANCELLED') AND created_at >= date_trunc('week', now())",
        [creatorId]
      );
      if (parseInt(countRows[0].count) >= 5)
        return res.status(422).json({ error: 'ERR_QUOTA_EXCEEDED', message: 'Weekly quota reached (5 bookings/week)' });

      // 4. Create Booking
      const { rows: newBooking } = await client.query(
        `INSERT INTO bookings (creator_id, class_id, date, slot_id, purpose, attendee_count, course_name, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'DRAFT') RETURNING *`,
        [creatorId, class_id, date, slot_id, purpose, attendee_count, course_name]
      );
      const booking = newBooking[0];
      
      await addLog(client, { 
        bookingId: booking.id, 
        actorId: creatorId, 
        fromStatus: null, 
        toStatus: 'DRAFT', 
        comment: 'Booking created' 
      });

      await client.query('COMMIT');
      res.status(201).json(booking);
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23505') return res.status(409).json({ error: 'Room is already booked for this slot' });
      throw err;
    } finally { client.release(); }
  } catch (err) { next(err); }
}

// PATCH /bookings/:id/submit — CREATOR: DRAFT → PENDING_REVIEW
async function submit(req, res, next) {
  try {
    const userId = req.user.sub;
    const role   = req.user.role;
    const { id } = req.params;
    if (role !== 'CREATOR') return res.status(403).json({ error: 'Only creators can submit' });

    const { rows } = await pool.query(`SELECT * FROM bookings WHERE id = $1 AND creator_id = $2`, [id, userId]);
    if (!rows.length) return res.status(404).json({ error: 'Booking not found' });
    if (rows[0].status !== 'DRAFT') return res.status(400).json({ error: 'Only DRAFT bookings can be submitted' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE bookings SET status='PENDING_REVIEW', submitted_at=NOW() WHERE id=$1`, [id]
      );
      await addLog(client, { bookingId: id, actorId: userId, fromStatus: 'DRAFT', toStatus: 'PENDING_REVIEW', comment: req.body.comment || 'Submitted for review' });
      await client.query('COMMIT');

      // Notify all reviewers
      const { rows: reviewers } = await pool.query(`SELECT id FROM users WHERE role = 'REVIEWER' AND status = 'ACTIVE'`);
      for (const r of reviewers) {
        await notify({ user_id: r.id, booking_id: id, type: 'BOOKING_SUBMITTED', title: 'New Booking Awaiting Review', message: `Booking "${rows[0].purpose}" needs your review.` });
      }
      res.json({ message: 'Submitted successfully', status: 'PENDING_REVIEW' });
    } catch (err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
  } catch (err) { next(err); }
}

// PATCH /bookings/:id/claim — REVIEWER: PENDING_REVIEW → IN_REVIEW
async function claim(req, res, next) {
  try {
    const userId = req.user.sub;
    const role   = req.user.role;
    const { id } = req.params;
    if (role !== 'REVIEWER') return res.status(403).json({ error: 'Only reviewers can claim' });

    const { rows } = await pool.query(`SELECT * FROM bookings WHERE id = $1`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Booking not found' });
    if (rows[0].status !== 'PENDING_REVIEW') return res.status(400).json({ error: 'Booking is not pending review' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE bookings SET status='IN_REVIEW', reviewer_id=$1 WHERE id=$2`, [userId, id]);
      await addLog(client, { bookingId: id, actorId: userId, fromStatus: 'PENDING_REVIEW', toStatus: 'IN_REVIEW', comment: 'Claimed by reviewer' });
      await client.query('COMMIT');
      notify({ user_id: rows[0].creator_id, booking_id: id, type: 'BOOKING_CLAIMED', title: 'Booking Under Review', message: 'Your booking is now being reviewed.' });
      res.json({ message: 'Claimed', status: 'IN_REVIEW' });
    } catch (err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
  } catch (err) { next(err); }
}

// PATCH /bookings/:id/forward — REVIEWER: IN_REVIEW → PENDING_APPROVAL
async function forward(req, res, next) {
  try {
    const userId = req.user.sub;
    const role   = req.user.role;
    const { id } = req.params;
    if (role !== 'REVIEWER') return res.status(403).json({ error: 'Only reviewers can forward' });

    const { rows } = await pool.query(`SELECT * FROM bookings WHERE id=$1 AND reviewer_id=$2`, [id, userId]);
    if (!rows.length) return res.status(404).json({ error: 'Booking not found or not claimed by you' });
    if (rows[0].status !== 'IN_REVIEW') return res.status(400).json({ error: 'Booking must be IN_REVIEW' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE bookings SET status='PENDING_APPROVAL', reviewer_note=$1 WHERE id=$2`,
        [req.body.note || null, id]
      );
      await addLog(client, { bookingId: id, actorId: userId, fromStatus: 'IN_REVIEW', toStatus: 'PENDING_APPROVAL', comment: req.body.note || 'Forwarded to approver' });
      await client.query('COMMIT');

      const { rows: approvers } = await pool.query(`SELECT id FROM users WHERE role='APPROVER' AND status='ACTIVE'`);
      for (const a of approvers) {
        await notify({ user_id: a.id, booking_id: id, type: 'BOOKING_FORWARDED', title: 'Booking Ready for Approval', message: 'A booking has been reviewed and needs your approval.' });
      }
      res.json({ message: 'Forwarded', status: 'PENDING_APPROVAL' });
    } catch (err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
  } catch (err) { next(err); }
}

// PATCH /bookings/:id/approve — APPROVER: PENDING_APPROVAL → APPROVED
async function approve(req, res, next) {
  try {
    const userId = req.user.sub;
    const role   = req.user.role;
    const { id } = req.params;
    if (role !== 'APPROVER' && role !== 'ADMIN') return res.status(403).json({ error: 'Only approvers can approve' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: bookings } = await client.query("SELECT * FROM bookings WHERE id = $1 FOR UPDATE", [id]);
      if (!bookings.length) return res.status(404).json({ error: 'Booking not found' });
      const b = bookings[0];

      if (b.status !== 'PENDING_APPROVAL') return res.status(400).json({ error: 'Booking must be PENDING_APPROVAL' });

      // SRS LOGIC-APP-001: Race condition conflict check
      // Check if another booking was approved for this room/date/slot while this one was pending
      const { rows: conflicts } = await client.query(
        `SELECT id FROM bookings 
         WHERE class_id = $1 AND date = $2 AND slot_id = $3 
         AND status = 'APPROVED' AND id <> $4`,
        [b.class_id, b.date, b.slot_id, id]
      );

      if (conflicts.length > 0) {
        await client.query("UPDATE bookings SET status = 'REJECTED' WHERE id = $1", [id]);
        await addLog(client, { bookingId: id, actorId: userId, fromStatus: 'PENDING_APPROVAL', toStatus: 'REJECTED', comment: 'Auto-rejected due to approval conflict' });
        await client.query('COMMIT');
        return res.status(409).json({ error: 'ERR_CLASS_CONFLICT_ON_APPROVE', message: 'This room was just booked by another request.' });
      }

      // Finalize Approval
      await client.query(
        `UPDATE bookings SET status='APPROVED', approver_id=$1, approver_note=$2, approved_at=NOW() WHERE id=$3`,
        [userId, req.body.note || null, id]
      );
      
      await addLog(client, { bookingId: id, actorId: userId, fromStatus: 'PENDING_APPROVAL', toStatus: 'APPROVED', comment: req.body.note || 'Approved' });
      await client.query('COMMIT');

      notify({ user_id: b.creator_id, booking_id: id, type: 'BOOKING_APPROVED', title: 'Booking Approved!', message: `Your booking for ${b.course_name || b.purpose} has been approved.` });
      res.json({ message: 'Approved', status: 'APPROVED' });
    } catch (err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
  } catch (err) { next(err); }
}

// PATCH /bookings/:id/reject — REVIEWER or APPROVER → REJECTED
async function reject(req, res, next) {
  try {
    const userId = req.user.sub;
    const role   = req.user.role;
    const { id } = req.params;
    if (!['REVIEWER', 'APPROVER', 'ADMIN'].includes(role)) return res.status(403).json({ error: 'Not authorized' });
    if (!req.body.reason) return res.status(400).json({ error: 'reason is required for rejection' });

    const { rows } = await pool.query(`SELECT * FROM bookings WHERE id=$1`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Booking not found' });

    const allowedFrom = ['PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL'];
    if (!allowedFrom.includes(rows[0].status)) return res.status(400).json({ error: `Cannot reject from status ${rows[0].status}` });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE bookings SET status='REJECTED', rejected_at=NOW() WHERE id=$1`, [id]);
      await addLog(client, { bookingId: id, actorId: userId, fromStatus: rows[0].status, toStatus: 'REJECTED', comment: req.body.reason });
      await client.query('COMMIT');
      notify({ user_id: rows[0].creator_id, booking_id: id, type: 'BOOKING_REJECTED', title: 'Booking Rejected', message: `Your booking was rejected. Reason: ${req.body.reason}` });
      res.json({ message: 'Rejected', status: 'REJECTED' });
    } catch (err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
  } catch (err) { next(err); }
}

// PATCH /bookings/:id/cancel — CREATOR → CANCELLED
async function cancel(req, res, next) {
  try {
    const userId = req.user.sub;
    const role   = req.user.role;
    const { id } = req.params;

    const { rows } = await pool.query(`SELECT * FROM bookings WHERE id=$1`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Booking not found' });

    const b = rows[0];
    if (role === 'CREATOR' && b.creator_id !== userId) return res.status(403).json({ error: 'Access denied' });
    if (!['DRAFT', 'PENDING_REVIEW'].includes(b.status)) return res.status(400).json({ error: 'Can only cancel DRAFT or PENDING_REVIEW bookings' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE bookings SET status='CANCELLED', cancelled_at=NOW() WHERE id=$1`, [id]);
      await addLog(client, { bookingId: id, actorId: userId, fromStatus: b.status, toStatus: 'CANCELLED', comment: req.body.reason || 'Cancelled by creator' });
      await client.query('COMMIT');
      res.json({ message: 'Cancelled', status: 'CANCELLED' });
    } catch (err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
  } catch (err) { next(err); }
}

async function getStats(req, res, next) {
  try {
    const userId = req.user.sub;
    const role   = req.user.role;

    let query = '';
    let params = [];

    if (role === 'CREATOR') {
      query = `
        SELECT
          COUNT(*) FILTER (WHERE status = 'DRAFT')            AS draft,
          COUNT(*) FILTER (WHERE status IN ('PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL')) AS processing,
          COUNT(*) FILTER (WHERE status = 'APPROVED')         AS approved,
          COUNT(*)                                            AS total
        FROM bookings
        WHERE creator_id = $1
      `;
      params = [userId];
    } else if (role === 'REVIEWER') {
      query = `
        SELECT
          COUNT(*) FILTER (WHERE status = 'PENDING_REVIEW')   AS pending,
          COUNT(*) FILTER (WHERE status = 'IN_REVIEW' AND reviewer_id = $1) AS in_review,
          COUNT(*) FILTER (WHERE (status = 'PENDING_APPROVAL' OR status = 'REJECTED') AND reviewer_id = $1 AND updated_at >= CURRENT_DATE) AS processed_today,
          COUNT(*)                                            AS total
        FROM bookings
      `;
      params = [userId];
    } else if (role === 'APPROVER') {
      query = `
        SELECT
          COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL') AS pending,
          COUNT(*) FILTER (WHERE status = 'APPROVED' AND approver_id = $1 AND approved_at >= CURRENT_DATE) AS approved_today,
          COUNT(*) FILTER (WHERE status = 'REJECTED' AND approver_id = $1 AND updated_at >= CURRENT_DATE) AS rejected_today,
          COUNT(*)                                            AS total
        FROM bookings
      `;
      params = [userId];
    } else if (role === 'ADMIN') {
      query = `
        SELECT
          COUNT(*) FILTER (WHERE status = 'PENDING_REVIEW')   AS pending_review,
          COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL') AS pending_approval,
          COUNT(*) FILTER (WHERE status = 'APPROVED')         AS approved,
          COUNT(*)                                            AS total
        FROM bookings
      `;
      params = [];
    }

    if (!query) return res.json({});

    const { rows } = await pool.query(query, params);
    res.json(rows[0] || {});
  } catch (err) { next(err); }
}

module.exports = { list, getById, create, submit, claim, forward, approve, reject, cancel, getStats };
