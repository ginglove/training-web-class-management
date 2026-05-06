/**
 * reviewer.controller.js
 * SRS 19.6 — Dedicated reviewer endpoints
 * Mounted at /api/reviewer
 */
const pool = require('../db');

// ─────────────────────────────────────────────
// GET /api/reviewer/queue
// PENDING_REVIEW list — paginated, filtered, sorted
// ─────────────────────────────────────────────
async function queue(req, res, next) {
  try {
    if (req.user.role !== 'REVIEWER') return res.status(403).json({ error: 'Forbidden' });

    const {
      page = 1, limit = 20,
      sort = 'oldest',     // oldest | newest | date_asc | attendees
      booker = '',
      class_id,
      date_from, date_to,
    } = req.query;
    const offset = (page - 1) * limit;

    let where = [`b.status = 'PENDING_REVIEW'`];
    let params = [];
    let i = 1;

    if (booker)    { where.push(`bs.creator_name ILIKE $${i++}`); params.push(`%${booker}%`); }
    if (class_id)  { where.push(`b.class_id = $${i++}`);          params.push(class_id); }
    if (date_from) { where.push(`b.date >= $${i++}`);             params.push(date_from); }
    if (date_to)   { where.push(`b.date <= $${i++}`);             params.push(date_to); }

    const sortMap = {
      oldest:    'b.submitted_at ASC NULLS LAST',
      newest:    'b.submitted_at DESC',
      date_asc:  'b.date ASC',
      attendees: 'b.attendee_count DESC',
    };
    const orderBy = sortMap[sort] || 'b.submitted_at ASC NULLS LAST';

    const { rows } = await pool.query(
      `SELECT bs.*, b.submitted_at, b.claimed_at, COUNT(*) OVER() AS total_count
       FROM booking_summary bs
       JOIN bookings b ON b.id = bs.id
       WHERE ${where.join(' AND ')}
       ORDER BY ${orderBy}
       LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    );

    const total = rows[0]?.total_count ?? 0;
    res.json({ data: rows, meta: { total: parseInt(total), page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────
// GET /api/reviewer/in-progress
// IN_REVIEW bookings claimed by current user
// ─────────────────────────────────────────────
async function inProgress(req, res, next) {
  try {
    if (req.user.role !== 'REVIEWER') return res.status(403).json({ error: 'Forbidden' });

    const { rows } = await pool.query(
      `SELECT bs.*, b.submitted_at, b.claimed_at
       FROM booking_summary bs
       JOIN bookings b ON b.id = bs.id
       WHERE b.status = 'IN_REVIEW' AND b.reviewer_id = $1
       ORDER BY b.claimed_at ASC`,
      [req.user.sub]
    );

    res.json({ data: rows });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────
// GET /api/reviewer/history
// Bookings this reviewer forwarded or rejected
// ─────────────────────────────────────────────
async function history(req, res, next) {
  try {
    if (!['REVIEWER', 'ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

    const { action, result, date_from, date_to, page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;

    let where = [
      `b.reviewer_id = $1`,
      `b.status IN ('PENDING_APPROVAL','APPROVED','REJECTED')`,
    ];
    let params = [req.user.sub];
    let i = 2;

    if (action === 'FORWARDED') where.push(`b.status IN ('PENDING_APPROVAL','APPROVED')`);
    if (action === 'REJECTED')  where.push(`b.status = 'REJECTED'`);
    if (result)    { where.push(`b.status = $${i++}`);         params.push(result); }
    if (date_from) { where.push(`b.updated_at >= $${i++}`);    params.push(date_from); }
    if (date_to)   { where.push(`b.updated_at <= $${i++}`);    params.push(date_to); }

    const { rows } = await pool.query(
      `SELECT bs.*,
              b.updated_at AS processed_at,
              b.reviewer_note,
              b.claimed_at,
              COUNT(*) OVER() AS total_count
       FROM booking_summary bs
       JOIN bookings b ON b.id = bs.id
       WHERE ${where.join(' AND ')}
       ORDER BY b.updated_at DESC
       LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    );

    const total = rows[0]?.total_count ?? 0;
    res.json({ data: rows, meta: { total: parseInt(total), page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────
// GET /api/reviewer/stats
// KPI: counts per status, avg processing time (7d)
// ─────────────────────────────────────────────
async function stats(req, res, next) {
  try {
    if (!['REVIEWER', 'ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

    const userId = req.user.sub;

    const { rows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'PENDING_REVIEW')                                AS pending,
         COUNT(*) FILTER (WHERE status = 'IN_REVIEW' AND reviewer_id = $1)               AS in_review,
         COUNT(*) FILTER (
           WHERE reviewer_id = $1
             AND status IN ('PENDING_APPROVAL','APPROVED','REJECTED')
             AND updated_at >= CURRENT_DATE
         )                                                                                AS processed_today,
         COUNT(*) FILTER (
           WHERE reviewer_id = $1
             AND status IN ('PENDING_APPROVAL','APPROVED')
             AND updated_at >= CURRENT_DATE - INTERVAL '30 days'
         )                                                                                AS forwarded_30d,
         COUNT(*) FILTER (
           WHERE reviewer_id = $1
             AND status = 'REJECTED'
             AND updated_at >= CURRENT_DATE - INTERVAL '30 days'
         )                                                                                AS rejected_30d,
         ROUND(
           AVG(
             EXTRACT(EPOCH FROM (updated_at - claimed_at)) / 3600.0
           ) FILTER (
             WHERE reviewer_id = $1
               AND claimed_at IS NOT NULL
               AND status IN ('PENDING_APPROVAL','APPROVED','REJECTED')
               AND updated_at >= CURRENT_DATE - INTERVAL '7 days'
           ), 1
         )                                                                                AS avg_hours_7d
       FROM bookings`,
      [userId]
    );

    res.json(rows[0] || {});
  } catch (err) { next(err); }
}

module.exports = { queue, inProgress, history, stats };
