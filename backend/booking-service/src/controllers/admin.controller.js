const pool = require('../db');
const { addLog } = require('../utils/booking-helpers');
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

// POST /admin/users
async function createUser(req, res, next) {
  try {
    const role = req.user.role;
    if (role !== 'ADMIN') return res.status(403).json({ error: 'ERR_NOT_ADMIN', message: 'Admin only' });

    const { 
      username, email, full_name, password, user_role, 
      department, phone, internal_notes, send_email 
    } = req.body;

    if (!username || !email || !full_name) {
      return res.status(400).json({ error: 'ERR_VALIDATION', message: 'Họ tên, Email và Tên đăng nhập là bắt buộc' });
    }

    // SRS 5.1.3: If admin creates, system can generate temp password
    // For now, if no password provided, generate a simple one
    const tempPassword = password || Math.random().toString(36).slice(-8);
    const hashed = await bcrypt.hash(tempPassword, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (
        username, email, full_name, password_hash, role, 
        department, phone, internal_notes, status, email_verified, must_change_password
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE', true, true)
      RETURNING id, username, email, full_name, role, department, status`,
      [username, email, full_name, hashed, user_role || 'CREATOR', department, phone, internal_notes]
    );

    // TODO: Send email with tempPassword if send_email is true
    // if (send_email) { await mailer.sendTempPassword(email, tempPassword); }

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      if (err.detail.includes('email')) return res.status(409).json({ error: 'ERR_EMAIL_EXISTS', message: 'Email đã tồn tại' });
      if (err.detail.includes('username')) return res.status(409).json({ error: 'ERR_USERNAME_EXISTS', message: 'Tên đăng nhập đã tồn tại' });
    }
    next(err);
  }
}

// GET /admin/users/:id
async function getUserDetail(req, res, next) {
  try {
    const role = req.user.role;
    if (role !== 'ADMIN') return res.status(403).json({ error: 'ERR_NOT_ADMIN' });

    const { id } = req.params;
    const { rows: userRows } = await pool.query(
      `SELECT id, email, username, full_name, role, department, phone, internal_notes, 
              status, email_verified, last_login_at, created_at, failed_login_count
       FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    if (!userRows.length) return res.status(404).json({ error: 'ERR_USER_NOT_FOUND' });

    // Fetch booking history
    const { rows: bookings } = await pool.query(
      `SELECT b.id, b.date, b.status, c.name as class_name, ts.slot_name
       FROM bookings b
       JOIN classes c ON b.class_id = c.id
       JOIN time_slots ts ON b.slot_id = ts.id
       WHERE b.creator_id = $1
       ORDER BY b.date DESC LIMIT 10`,
      [id]
    );

    res.json({
      profile: userRows[0],
      bookings: bookings,
      login_history: [] // Placeholder for login history if table exists
    });
  } catch (err) { next(err); }
}

// PATCH /admin/users/:id
async function updateUser(req, res, next) {
  try {
    const adminId = req.user.sub;
    const role    = req.user.role;
    if (role !== 'ADMIN') return res.status(403).json({ error: 'ERR_NOT_ADMIN' });

    const { id } = req.params;
    const { status, user_role, department, full_name, username, email, phone, internal_notes } = req.body;

    // SRS 5.1.4: Admin cannot deactivate themselves
    if (id === adminId && status === 'INACTIVE') {
      return res.status(422).json({ error: 'ERR_SELF_DEACTIVATE', message: 'Bạn không thể tự vô hiệu hóa tài khoản của chính mình' });
    }

    // SRS 5.1.4: Cannot demote the last admin
    if (user_role && user_role !== 'ADMIN') {
      const { rows: admins } = await pool.query("SELECT id FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE' AND deleted_at IS NULL");
      if (admins.length === 1 && admins[0].id === id) {
        return res.status(422).json({ error: 'ERR_CANNOT_DEMOTE_LAST_ADMIN', message: 'Không thể hạ quyền Admin cuối cùng của hệ thống' });
      }
    }

    const { rows } = await pool.query(
      `UPDATE users SET
        status         = COALESCE($1, status),
        role           = COALESCE($2, role),
        department     = COALESCE($3, department),
        full_name      = COALESCE($4, full_name),
        username       = COALESCE($5, username),
        email          = COALESCE($6, email),
        phone          = COALESCE($7, phone),
        internal_notes = COALESCE($8, internal_notes),
        updated_at     = NOW()
       WHERE id = $9 AND deleted_at IS NULL
       RETURNING id, email, username, full_name, role, department, status`,
      [status, user_role, department, full_name, username, email, phone, internal_notes, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'ERR_USER_NOT_FOUND' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// DELETE /admin/users/:id (Soft Delete)
async function deleteUser(req, res, next) {
  try {
    const adminId = req.user.sub;
    const { id } = req.params;

    if (id === adminId) return res.status(422).json({ error: 'ERR_SELF_DEACTIVATE', message: 'Không thể tự xóa chính mình' });

    // Check last admin
    const { rows: admins } = await pool.query("SELECT id FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE' AND deleted_at IS NULL");
    if (admins.length === 1 && admins[0].id === id) {
      return res.status(422).json({ error: 'ERR_CANNOT_DELETE_LAST_ADMIN', message: 'Không thể xóa Admin cuối cùng' });
    }

    // SRS LOGIC-ADM-USR-002: Check for pending bookings
    const { rows: bookings } = await pool.query(
      "SELECT id FROM bookings WHERE creator_id = $1 AND status IN ('PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL')",
      [id]
    );
    if (bookings.length > 0) {
      return res.status(422).json({ 
        error: 'LOGIC-ADM-USR-002', 
        message: `Người dùng có ${bookings.length} booking đang xử lý. Hãy hủy hoặc xử lý chúng trước khi xóa.`,
        count: bookings.length
      });
    }

    await pool.query("UPDATE users SET deleted_at = NOW(), status = 'INACTIVE' WHERE id = $1", [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) { next(err); }
}

// POST /admin/users/:id/unlock
async function unlockUser(req, res, next) {
  try {
    const role = req.user.role;
    if (role !== 'ADMIN') return res.status(403).json({ error: 'ERR_NOT_ADMIN' });

    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE users SET status = 'ACTIVE', failed_login_count = 0, locked_until = NULL, updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'ERR_USER_NOT_FOUND' });
    res.json({ message: 'User unlocked successfully' });
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

    await addLog(pool, { bookingId: id, actorId: req.user.sub, fromStatus: rows[0].status, toStatus: 'CANCELLED', comment: reason || 'Cancelled by Admin' });

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

// GET /admin/config
async function getConfig(req, res, next) {
  try {
    const role = req.user.role;
    if (role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

    const { rows } = await pool.query(`SELECT key, value, description FROM system_config`);
    const config = {};
    rows.forEach(r => {
      // Try to parse numeric or boolean values
      if (r.value === 'true') config[r.key] = true;
      else if (r.value === 'false') config[r.key] = false;
      else if (!isNaN(r.value) && r.value.trim() !== '') config[r.key] = Number(r.value);
      else config[r.key] = r.value;
    });
    res.json(config);
  } catch (err) { next(err); }
}

// PATCH /admin/config
async function updateConfig(req, res, next) {
  try {
    const role = req.user.role;
    if (role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

    const updates = req.body; // { key1: val1, key2: val2 }
    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        `INSERT INTO system_config (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, String(value)]
      );
    }

    res.json({ message: 'Configuration updated successfully' });
  } catch (err) { next(err); }
}

module.exports = { 
  listUsers,
  createUser,
  getUserDetail,
  updateUser, 
  deleteUser, 
  unlockUser,
  createRoom, 
  updateRoom, 
  cancelBooking, 
  getStats, 
  getAuditLogs,
  getConfig,
  updateConfig
};
