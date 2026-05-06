/**
 * comments.controller.js
 * Handles POST + GET /api/bookings/:id/comments
 * and GET /api/bookings/:id/history
 */
const pool = require('../db');

// ─────────────────────────────────────────────
// POST /api/bookings/:id/comments
// Add a comment to a booking { content, is_internal }
// ─────────────────────────────────────────────
async function addComment(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    const role   = req.user.role;
    const { content, is_internal = false } = req.body;

    if (!content || content.trim().length < 10)
      return res.status(422).json({ error: 'ERR_COMMENT_TOO_SHORT', message: 'Nhận xét phải có ít nhất 10 ký tự' });

    // Access check: must be linked to this booking or be Admin
    const { rows: booking } = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (!booking.length) return res.status(404).json({ error: 'Booking not found' });

    const b = booking[0];
    const allowed = role === 'ADMIN'
      || b.creator_id === userId
      || b.reviewer_id === userId
      || b.approver_id === userId
      || role === 'REVIEWER'   // Reviewer can comment while booking is PENDING_REVIEW
      || role === 'APPROVER';

    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    // is_internal only allowed for REVIEWER / APPROVER / ADMIN
    const storeInternal = is_internal && ['REVIEWER', 'APPROVER', 'ADMIN'].includes(role);

    const { rows } = await pool.query(
      `INSERT INTO booking_comments (booking_id, author_id, content, is_internal)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, userId, content.trim(), storeInternal]
    );

    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────
// GET /api/bookings/:id/comments
// List comments — internal filtered for non-Admin
// ─────────────────────────────────────────────
async function listComments(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    const role   = req.user.role;

    // Access check
    const { rows: booking } = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (!booking.length) return res.status(404).json({ error: 'Booking not found' });

    const b = booking[0];
    if (role === 'CREATOR' && b.creator_id !== userId)
      return res.status(403).json({ error: 'Access denied' });

    // Non-admin / non-reviewer cannot see is_internal comments unless they are the author
    const filterInternal = !['ADMIN', 'REVIEWER', 'APPROVER'].includes(role);

    const { rows } = await pool.query(
      `SELECT bc.*, u.full_name AS author_name, u.role AS author_role
       FROM booking_comments bc
       JOIN users u ON bc.author_id = u.id
       WHERE bc.booking_id = $1
         ${filterInternal ? `AND (bc.is_internal = FALSE OR bc.author_id = '${userId}')` : ''}
       ORDER BY bc.created_at ASC`,
      [id]
    );

    res.json({ data: rows });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────
// GET /api/bookings/:id/history
// Full audit trail for a booking (booking_logs)
// ─────────────────────────────────────────────
async function getHistory(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    const role   = req.user.role;

    const { rows: booking } = await pool.query('SELECT creator_id FROM bookings WHERE id = $1', [id]);
    if (!booking.length) return res.status(404).json({ error: 'Booking not found' });

    if (role === 'CREATOR' && booking[0].creator_id !== userId)
      return res.status(403).json({ error: 'Access denied' });

    const { rows } = await pool.query(
      `SELECT bl.*, u.full_name AS actor_name, u.role AS actor_role
       FROM booking_logs bl
       JOIN users u ON bl.actor_id = u.id
       WHERE bl.booking_id = $1
       ORDER BY bl.created_at ASC`,
      [id]
    );

    res.json({ data: rows });
  } catch (err) { next(err); }
}

module.exports = { addComment, listComments, getHistory };
