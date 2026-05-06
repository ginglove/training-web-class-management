/**
 * approver.controller.js
 * SRS 20 — Dedicated approver endpoints
 * Mounted at /api/approver
 */
const pool = require('../db');

// ─────────────────────────────────────────────
// GET /api/approver/queue
// PENDING_APPROVAL list — paginated, filtered, sorted
// ─────────────────────────────────────────────
async function queue(req, res, next) {
  try {
    if (!['APPROVER', 'ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

    const {
      page = 1, limit = 20,
      sort = 'urgent',     // urgent | nearest_date | newest | reviewer_asc
      reviewer_id,
      class_id,
      date_from, date_to,
    } = req.query;
    const offset = (page - 1) * limit;

    let where = [`b.status = 'PENDING_APPROVAL'`];
    let params = [];
    let i = 1;

    if (reviewer_id) { where.push(`b.reviewer_id = $${i++}`);     params.push(reviewer_id); }
    if (class_id)    { where.push(`b.class_id = $${i++}`);        params.push(class_id); }
    if (date_from)   { where.push(`b.date >= $${i++}`);           params.push(date_from); }
    if (date_to)     { where.push(`b.date <= $${i++}`);           params.push(date_to); }

    const sortMap = {
      urgent:       'b.updated_at ASC',        // the older it was updated (forwarded), the more urgent
      nearest_date: 'b.date ASC',
      newest:       'b.updated_at DESC',
      reviewer_asc: 'bs.reviewer_name ASC',
    };
    const orderBy = sortMap[sort] || 'b.updated_at ASC';

    const { rows } = await pool.query(
      `SELECT bs.*, 
              b.updated_at AS forwarded_at,
              COUNT(*) OVER() AS total_count
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
// GET /api/approver/history
// Bookings this approver approved or rejected
// ─────────────────────────────────────────────
async function history(req, res, next) {
  try {
    if (!['APPROVER', 'ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

    const { action, reviewer_id, class_id, date_from, date_to, page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;

    let where = [
      `b.approver_id = $1`,
      `b.status IN ('APPROVED','REJECTED')`,
    ];
    let params = [req.user.sub];
    let i = 2;

    if (action === 'APPROVED') where.push(`b.status = 'APPROVED'`);
    if (action === 'REJECTED') where.push(`b.status = 'REJECTED'`);
    if (reviewer_id)           { where.push(`b.reviewer_id = $${i++}`); params.push(reviewer_id); }
    if (class_id)              { where.push(`b.class_id = $${i++}`);    params.push(class_id); }
    if (date_from)             { where.push(`b.updated_at >= $${i++}`); params.push(date_from); }
    if (date_to)               { where.push(`b.updated_at <= $${i++}`); params.push(date_to); }

    const { rows } = await pool.query(
      `SELECT bs.*,
              b.updated_at AS processed_at,
              b.approver_note,
              b.rejection_reason,
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
// GET /api/approver/stats
// KPI: counts per status, avg processing time (7d)
// ─────────────────────────────────────────────
async function stats(req, res, next) {
  try {
    if (!['APPROVER', 'ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

    const userId = req.user.sub;

    const { rows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL')                              AS pending,
         COUNT(*) FILTER (
           WHERE approver_id = $1
             AND status = 'APPROVED'
             AND updated_at >= CURRENT_DATE
         )                                                                                AS approved_today,
         COUNT(*) FILTER (
           WHERE approver_id = $1
             AND status = 'REJECTED'
             AND updated_at >= CURRENT_DATE
         )                                                                                AS rejected_today,
         ROUND(
           AVG(
             EXTRACT(EPOCH FROM (updated_at - (
                SELECT created_at FROM booking_logs bl 
                WHERE bl.booking_id = bookings.id AND bl.to_status = 'PENDING_APPROVAL' 
                ORDER BY created_at DESC LIMIT 1
             ))) / 3600.0
           ) FILTER (
             WHERE approver_id = $1
               AND status IN ('APPROVED','REJECTED')
               AND updated_at >= CURRENT_DATE - INTERVAL '7 days'
           ), 1
         )                                                                                AS avg_hours_7d
       FROM bookings`,
      [userId]
    );

    res.json(rows[0] || {});
  } catch (err) { next(err); }
}

module.exports = { queue, history, stats };
