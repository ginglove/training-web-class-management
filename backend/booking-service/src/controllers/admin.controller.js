const pool = require('../db');
const bcrypt = require('bcrypt');

// GET /admin/users
async function listUsers(req, res, next) {
  try {
    const role = req.user.role;
    if (role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

    const { rows } = await pool.query(
      `SELECT id, email, username, full_name, role, department, status, email_verified, last_login_at, created_at
       FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
}

// PATCH /admin/users/:id
async function updateUser(req, res, next) {
  try {
    const adminId = req.user.sub;
    const role    = req.user.role;
    if (role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

    const { id } = req.params;
    const { status, user_role, department } = req.body;

    // SRS 5.1.4: Admin cannot deactivate themselves
    if (id === adminId && status === 'INACTIVE') {
      return res.status(422).json({ error: 'ERR_SELF_DEACTIVATE', message: 'You cannot deactivate your own account' });
    }

    // SRS 5.1.4: Cannot demote the last admin
    if (user_role && user_role !== 'ADMIN') {
      const { rows: admins } = await pool.query("SELECT id FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE'");
      if (admins.length === 1 && admins[0].id === id) {
        return res.status(422).json({ error: 'ERR_CANNOT_DEMOTE_LAST_ADMIN', message: 'Cannot demote the last active Admin' });
      }
    }

    const { rows } = await pool.query(
      `UPDATE users SET
        status     = COALESCE($1, status),
        role       = COALESCE($2, role),
        department = COALESCE($3, department),
        updated_at = NOW()
       WHERE id = $4 AND deleted_at IS NULL
       RETURNING id, email, username, full_name, role, department, status`,
      [status, user_role, department, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// DELETE /admin/users/:id (Soft Delete)
async function deleteUser(req, res, next) {
  try {
    const adminId = req.user.sub;
    if (req.params.id === adminId) return res.status(422).json({ error: 'Cannot delete self' });

    const { rows: admins } = await pool.query("SELECT id FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE'");
    if (admins.length === 1 && admins[0].id === req.params.id) {
      return res.status(422).json({ error: 'ERR_CANNOT_DELETE_LAST_ADMIN' });
    }

    await pool.query("UPDATE users SET deleted_at = NOW(), status = 'INACTIVE' WHERE id = $1", [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) { next(err); }
}

// POST /admin/rooms
async function createRoom(req, res, next) {
  try {
    const role = req.user.role;
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
    const role = req.user.role;
    if (role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

    const { id } = req.params;
    const { name, location, capacity, description, equipment, status } = req.body;

    // SRS 5.2.2: Cannot PERMANENTLY CLOSE room if there are future APPROVED bookings.
    // MAINTENANCE is allowed (reversible). Only CLOSED is blocked.
    if (status === 'CLOSED') {
      const { rows: futureBookings } = await pool.query(
        `SELECT b.id, b.date, ts.slot_name
         FROM bookings b
         JOIN time_slots ts ON b.slot_id = ts.id
         WHERE b.class_id = $1 AND b.status = 'APPROVED'
           AND b.date >= CURRENT_DATE
         ORDER BY b.date ASC`,
        [id]
      );
      if (futureBookings.length > 0) {
        return res.status(422).json({ 
          error: 'ERR_CANNOT_CLOSE_CLASS', 
          message: `Cannot close room: ${futureBookings.length} future approved booking(s) exist. Cancel them first or set to MAINTENANCE instead.`,
          bookings: futureBookings
        });
      }
    }

    const { rows } = await pool.query(
      `UPDATE classes SET
        name        = COALESCE($1, name),
        location    = COALESCE($2, location),
        capacity    = COALESCE($3, capacity),
        description = COALESCE($4, description),
        equipment   = COALESCE($5, equipment),
        status      = COALESCE($6, status),
        updated_at  = NOW()
       WHERE id = $7 RETURNING *`,
      [name, location, capacity, description, equipment ? JSON.stringify(equipment) : null, status, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Room not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// POST /admin/bookings/:id/cancel
async function cancelBooking(req, res, next) {
  try {
    const role = req.user.role;
    if (role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

    const { id } = req.params;
    const { reason } = req.body;

    const { rows } = await pool.query(
      `UPDATE bookings SET status = 'CANCELLED', rejection_reason = $1, cancelled_at = NOW() WHERE id = $2 RETURNING *`,
      [reason || 'Cancelled by Admin', id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Booking not found' });

    await addLog({ bookingId: id, actorId: req.user.sub, fromStatus: rows[0].status, toStatus: 'CANCELLED', comment: reason || 'Cancelled by Admin' });

    res.json({ message: 'Booking cancelled by Admin' });
  } catch (err) { next(err); }
}

// GET /admin/stats
async function getStats(req, res, next) {
  try {
    const role = req.user.role;
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

// GET /admin/audit
async function getAuditLogs(req, res, next) {
  try {
    const role = req.user.role;
    if (role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

    const { rows } = await pool.query(
      `SELECT bl.*, u.full_name AS actor_name, u.username AS actor_username
       FROM booking_logs bl
       LEFT JOIN users u ON bl.actor_id = u.id
       ORDER BY bl.created_at DESC
       LIMIT 100`
    );
    res.json(rows);
  } catch (err) { next(err); }
}

module.exports = { listUsers, updateUser, deleteUser, createRoom, updateRoom, cancelBooking, getStats, getAuditLogs };
