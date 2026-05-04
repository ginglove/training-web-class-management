const pool = require('../db');
const bcrypt = require('bcrypt');

// GET /admin/users
async function listUsers(req, res, next) {
  try {
    const role = req.headers['x-user-role'];
    if (role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

    const { rows } = await pool.query(
      `SELECT id, email, full_name, role, department, is_active, email_verified, last_login_at, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
}

// PATCH /admin/users/:id
async function updateUser(req, res, next) {
  try {
    const role = req.headers['x-user-role'];
    if (role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

    const { id } = req.params;
    const { is_active, user_role, department } = req.body;

    const { rows } = await pool.query(
      `UPDATE users SET
        is_active  = COALESCE($1, is_active),
        role       = COALESCE($2, role),
        department = COALESCE($3, department)
       WHERE id = $4
       RETURNING id, email, full_name, role, department, is_active`,
      [is_active, user_role, department, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// POST /admin/rooms
async function createRoom(req, res, next) {
  try {
    const role = req.headers['x-user-role'];
    if (role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

    const { name, location, capacity, description, equipment = {} } = req.body;
    if (!name || !location || !capacity) return res.status(400).json({ error: 'name, location, capacity required' });

    const { rows } = await pool.query(
      `INSERT INTO classes (name, location, capacity, description, equipment)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, location, capacity, description, JSON.stringify(equipment)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Room name already exists' });
    next(err);
  }
}

// PATCH /admin/rooms/:id
async function updateRoom(req, res, next) {
  try {
    const role = req.headers['x-user-role'];
    if (role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

    const { id } = req.params;
    const { name, location, capacity, description, equipment, is_active } = req.body;

    const { rows } = await pool.query(
      `UPDATE classes SET
        name        = COALESCE($1, name),
        location    = COALESCE($2, location),
        capacity    = COALESCE($3, capacity),
        description = COALESCE($4, description),
        equipment   = COALESCE($5, equipment),
        is_active   = COALESCE($6, is_active)
       WHERE id = $7 RETURNING *`,
      [name, location, capacity, description, equipment ? JSON.stringify(equipment) : null, is_active, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Room not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// GET /admin/stats
async function getStats(req, res, next) {
  try {
    const role = req.headers['x-user-role'];
    if (!['ADMIN', 'APPROVER'].includes(role)) return res.status(403).json({ error: 'Insufficient role' });

    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'PENDING_REVIEW')  AS pending_review,
        COUNT(*) FILTER (WHERE status = 'IN_REVIEW')       AS in_review,
        COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL')AS pending_approval,
        COUNT(*) FILTER (WHERE status = 'APPROVED')        AS approved,
        COUNT(*) FILTER (WHERE status = 'REJECTED')        AS rejected,
        COUNT(*) FILTER (WHERE status = 'CANCELLED')       AS cancelled,
        COUNT(*)                                           AS total
      FROM bookings
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);
    const { rows: userRows } = await pool.query(`SELECT role, COUNT(*) AS count FROM users GROUP BY role`);
    res.json({ bookings: rows[0], users: userRows });
  } catch (err) { next(err); }
}

module.exports = { listUsers, updateUser, createRoom, updateRoom, getStats };
