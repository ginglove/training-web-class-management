const pool = require('../db');

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function writeAuditLog(client, { action, actor_id, target_type, target_id, meta }) {
  await client.query(
    `INSERT INTO booking_logs (booking_id, action, performed_by, note, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [target_id, action, actor_id, JSON.stringify(meta)]
  ).catch(() => {
    // audit_log table might use different schema; silently skip if missing
  });
}

// Find APPROVED bookings that overlap with [start, end] for a given room (or all rooms)
async function findAffectedBookings(client, { class_id, start_datetime, end_datetime }) {
  const params = [start_datetime, end_datetime];
  let classFilter = '';
  if (class_id) {
    params.push(class_id);
    classFilter = `AND class_id = $${params.length}`;
  }
  const { rows } = await client.query(
    `SELECT b.id, b.purpose AS title, b.creator_id,
            u.full_name AS creator_name, u.email AS creator_email,
            c.name AS class_name,
            (b.date + b.start_time) AS start_dt,
            (b.date + b.end_time)   AS end_dt
     FROM booking_summary b
     JOIN users u  ON u.id = b.creator_id
     JOIN classes c ON c.id = b.class_id
     WHERE b.status = 'APPROVED'
       AND (b.date + b.start_time) < $2::timestamptz
       AND (b.date + b.end_time)   > $1::timestamptz
       ${classFilter}`,
    params
  );
  return rows;
}

// ─── Calendar Events ──────────────────────────────────────────────────────────

exports.getCalendarEvents = async (req, res) => {
  try {
    const { start, end, class_id, status } = req.query;
    const userRole = req.user.role;
    const userId   = req.user.sub;

    let bookingConds  = ["status NOT IN ('DRAFT')"];
    let bookingParams = [];

    if (start && end) {
      bookingParams.push(start, end);
      bookingConds.push(`(date + start_time) >= $${bookingParams.length - 1}::timestamptz`);
      bookingConds.push(`(date + end_time)   <= $${bookingParams.length}::timestamptz`);
    }
    if (class_id) {
      bookingParams.push(class_id);
      bookingConds.push(`class_id = $${bookingParams.length}`);
    }
    if (status && status.length) {
      const list = Array.isArray(status) ? status : status.split(',');
      const ph   = list.map(s => { bookingParams.push(s); return `$${bookingParams.length}`; }).join(',');
      bookingConds.push(`status IN (${ph})`);
    }
    if (userRole === 'CREATOR') {
      bookingConds.push(`(status = 'APPROVED' OR creator_id = '${userId}')`);
    }

    const bookingQuery = `
      SELECT id, class_id, class_name,
             purpose AS title, status,
             creator_name AS booked_by, creator_id,
             (date + start_time) AS start_datetime,
             (date + end_time)   AS end_datetime,
             'BOOKING' as event_type
      FROM booking_summary
      WHERE ${bookingConds.join(' AND ')}`;

    const { rows: bookings } = await pool.query(bookingQuery, bookingParams);

    let blockConds  = ['deleted_at IS NULL'];
    let blockParams = [];
    if (start && end) {
      blockParams.push(start, end);
      blockConds.push(`start_datetime < $${blockParams.length}::timestamptz`);
      blockConds.push(`end_datetime   > $${blockParams.length - 1}::timestamptz`);
    }
    if (class_id) {
      blockParams.push(class_id);
      blockConds.push(`(class_id = $${blockParams.length} OR class_id IS NULL)`);
    }

    const blockQuery = `
      SELECT id, class_id,
             (SELECT name FROM classes WHERE classes.id = manual_calendar_blocks.class_id) AS class_name,
             title, description, color,
             block_type AS status,
             'Admin' AS booked_by, created_by AS creator_id,
             start_datetime, end_datetime, is_all_day,
             'MANUAL_BLOCK' as event_type
      FROM manual_calendar_blocks
      WHERE ${blockConds.join(' AND ')}`;

    const { rows: blocks } = await pool.query(blockQuery, blockParams);

    res.json({ data: [...bookings, ...blocks] });
  } catch (error) {
    console.error('getCalendarEvents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getClassEvents = async (req, res) => {
  req.query.class_id = req.params.id;
  return exports.getCalendarEvents(req, res);
};

// ─── Availability ─────────────────────────────────────────────────────────────

exports.checkAvailability = async (req, res) => {
  try {
    const { class_id, start_datetime, end_datetime } = req.query;
    if (!class_id || !start_datetime || !end_datetime) {
      return res.status(400).json({ error: 'ERR_INVALID_DATE_RANGE', message: 'Missing required parameters' });
    }
    
    if (new Date(start_datetime) >= new Date(end_datetime)) {
      return res.status(422).json({ error: 'ERR_BLOCK_END_BEFORE_START', message: 'End time must be after start time' });
    }
    const { rows: conflicts } = await pool.query(
      `SELECT id, status, purpose as title,
              (date + start_time) as start, (date + end_time) as end
       FROM booking_summary
       WHERE class_id = $1
         AND status IN ('PENDING_APPROVAL','APPROVED')
         AND (date + start_time) < $3::timestamptz
         AND (date + end_time)   > $2::timestamptz`,
      [class_id, start_datetime, end_datetime]
    );
    const { rows: blockConflicts } = await pool.query(
      `SELECT id, block_type as status, title, start_datetime as start, end_datetime as end
       FROM manual_calendar_blocks
       WHERE (class_id = $1 OR class_id IS NULL)
         AND deleted_at IS NULL
         AND start_datetime < $3::timestamptz
         AND end_datetime   > $2::timestamptz`,
      [class_id, start_datetime, end_datetime]
    );
    const allConflicts = [...conflicts, ...blockConflicts];
    res.json({ data: { available: allConflicts.length === 0, conflicts: allConflicts } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── iCal Export ─────────────────────────────────────────────────────────────

exports.exportICal = async (req, res) => {
  try {
    // Basic iCal logic (stub)
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename="calendar.ics"');
    res.send('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Class Booking System//EN\r\nEND:VCALENDAR');
  } catch (error) {
    res.status(500).json({ error: 'ERR_ICAL_EXPORT_FAILED', message: 'Lỗi khi tạo file iCal export' });
  }
};

// ─── Admin Manual Blocks ──────────────────────────────────────────────────────

exports.getBlocks = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM manual_calendar_blocks WHERE deleted_at IS NULL ORDER BY start_datetime DESC'
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
};

/**
 * GET /admin/blocks/preflight?class_id=&start_datetime=&end_datetime=
 * Returns APPROVED bookings that would be affected by a new block.
 */
exports.preflightBlock = async (req, res) => {
  try {
    const { class_id, start_datetime, end_datetime } = req.query;
    if (!start_datetime || !end_datetime) {
      return res.status(400).json({ error: 'start_datetime and end_datetime required' });
    }
    const affected = await findAffectedBookings(pool, { class_id: class_id || null, start_datetime, end_datetime });
    res.json({ data: { count: affected.length, bookings: affected } });
  } catch (err) {
    console.error('preflightBlock error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
};

/**
 * POST /admin/blocks
 * Body: { class_id, block_type, title, description, start_datetime, end_datetime,
 *         is_all_day, color, cancel_affected (bool), notify_creators (bool) }
 *
 * 18.7.3 Logic:
 *   1. Find APPROVED bookings in the time range
 *   2. If cancel_affected=true  → cancel them + send notification payload
 *   3. INSERT block
 *   4. Write audit_log
 */
exports.createBlock = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      class_id, block_type, title, description,
      start_datetime, end_datetime, is_all_day, color,
      cancel_affected = false,
      notify_creators = false
    } = req.body;

    if (req.user.role !== 'ADMIN') {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'ERR_NOT_ADMIN', message: 'Cố tạo/sửa/xóa manual block khi không phải Admin' });
    }

    if (!title || !start_datetime || !end_datetime || !block_type) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'ERR_INVALID_DATE_RANGE', message: 'title, block_type, start_datetime, end_datetime are required' });
    }
    
    if (new Date(start_datetime) >= new Date(end_datetime)) {
      await client.query('ROLLBACK');
      return res.status(422).json({ error: 'ERR_BLOCK_END_BEFORE_START', message: 'end_datetime <= start_datetime' });
    }

    // Step 1 – Find affected APPROVED bookings
    const affected = await findAffectedBookings(client, {
      class_id: class_id || null,
      start_datetime,
      end_datetime
    });

    const affectedIds = affected.map(b => b.id);

    // Step 2 – Optionally cancel them
    if (cancel_affected && affectedIds.length > 0) {
      await client.query(
        `UPDATE bookings
         SET status = 'CANCELLED',
             cancellation_reason = $1,
             cancelled_at = NOW()
         WHERE id = ANY($2::uuid[])`,
        [`Phòng bị block bởi Admin: ${title}`, affectedIds]
      );
    }

    // Step 3 – Insert block
    const { rows } = await client.query(
      `INSERT INTO manual_calendar_blocks
         (class_id, created_by, block_type, title, description,
          start_datetime, end_datetime, is_all_day, color, affected_bookings)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        class_id || null,
        req.user.sub,
        block_type,
        title,
        description || null,
        start_datetime,
        end_datetime,
        is_all_day || false,
        color || null,
        affectedIds.length > 0 ? affectedIds : null
      ]
    );

    // Step 4 – Audit log
    await writeAuditLog(client, {
      action: 'MANUAL_BLOCK_CREATED',
      actor_id: req.user.sub,
      target_type: 'manual_block',
      target_id: rows[0].id,
      meta: {
        title,
        block_type,
        start_datetime,
        end_datetime,
        affected_bookings: affectedIds,
        cancel_affected,
        notify_creators
      }
    });

    await client.query('COMMIT');

    res.status(201).json({
      data: rows[0],
      affected_bookings: affected,
      cancelled: cancel_affected ? affectedIds.length : 0,
      notify_creators
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('createBlock error:', error);
    res.status(500).json({ error: 'Internal error' });
  } finally {
    client.release();
  }
};

exports.getBlock = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM manual_calendar_blocks WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
};

/**
 * PUT /admin/blocks/:id
 * 18.7.4: If time range expands → re-check conflicts.
 *         If time range shrinks → no conflict check needed.
 */
exports.updateBlock = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      class_id, block_type, title, description,
      start_datetime, end_datetime, is_all_day, color,
      cancel_affected = false, ignore_conflicts = false
    } = req.body;

    if (req.user.role !== 'ADMIN') {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'ERR_NOT_ADMIN', message: 'Cố tạo/sửa/xóa manual block khi không phải Admin' });
    }

    if (new Date(start_datetime) >= new Date(end_datetime)) {
      await client.query('ROLLBACK');
      return res.status(422).json({ error: 'ERR_BLOCK_END_BEFORE_START', message: 'end_datetime <= start_datetime' });
    }

    // Fetch existing block to compare time range
    const { rows: existing } = await client.query(
      'SELECT * FROM manual_calendar_blocks WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id]
    );
    if (!existing.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Block not found' });
    }

    const old = existing[0];
    const newStart = new Date(start_datetime);
    const newEnd   = new Date(end_datetime);
    const oldStart = new Date(old.start_datetime);
    const oldEnd   = new Date(old.end_datetime);

    // Time range expanded → check for new conflicts
    let affected = [];
    if (newStart < oldStart || newEnd > oldEnd) {
      affected = await findAffectedBookings(client, {
        class_id: class_id || null,
        start_datetime,
        end_datetime
      });

      if (cancel_affected && affected.length > 0) {
        await client.query(
          `UPDATE bookings
           SET status = 'CANCELLED',
               cancellation_reason = $1,
               cancelled_at = NOW()
           WHERE id = ANY($2::uuid[])`,
          [`Phòng bị block bởi Admin (cập nhật): ${title}`, affected.map(b => b.id)]
        );
      }
    }

    const changedFields = [];
    if (title       !== old.title)       changedFields.push('title');
    if (description !== old.description) changedFields.push('description');
    if (block_type  !== old.block_type)  changedFields.push('block_type');
    if (color       !== old.color)       changedFields.push('color');
    if (newStart.getTime() !== oldStart.getTime()) changedFields.push('start_datetime');
    if (newEnd.getTime()   !== oldEnd.getTime())   changedFields.push('end_datetime');

    const { rows } = await client.query(
      `UPDATE manual_calendar_blocks
       SET class_id=$1, block_type=$2, title=$3, description=$4,
           start_datetime=$5, end_datetime=$6, is_all_day=$7, color=$8,
           updated_at=NOW()
       WHERE id=$9 AND deleted_at IS NULL
       RETURNING *`,
      [class_id || null, block_type, title, description || null,
       start_datetime, end_datetime, is_all_day, color || null, req.params.id]
    );

    await writeAuditLog(client, {
      action: 'MANUAL_BLOCK_UPDATED',
      actor_id: req.user.sub,
      target_type: 'manual_block',
      target_id: req.params.id,
      meta: { changed_fields: changedFields, affected_bookings: affected.map(b => b.id), cancel_affected }
    });

    await client.query('COMMIT');
    res.json({
      data: rows[0],
      affected_bookings: affected,
      cancelled: cancel_affected ? affected.length : 0
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('updateBlock error:', error);
    res.status(500).json({ error: 'Internal error' });
  } finally {
    client.release();
  }
};

/**
 * DELETE /admin/blocks/:id  (soft delete)
 * 18.7.5: Returns count of APPROVED bookings that were covered by this block.
 */
exports.deleteBlock = async (req, res) => {
  const client = await pool.connect();
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'ERR_NOT_ADMIN', message: 'Cố tạo/sửa/xóa manual block khi không phải Admin' });
    }

    await client.query('BEGIN');

    const { rows: existing } = await client.query(
      'SELECT * FROM manual_calendar_blocks WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id]
    );
    if (!existing.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'ERR_BLOCK_NOT_FOUND', message: 'Block not found' });
    }

    const block = existing[0];

    // Count APPROVED bookings that were covered (slots freed)
    const covered = await findAffectedBookings(client, {
      class_id: block.class_id,
      start_datetime: block.start_datetime,
      end_datetime:   block.end_datetime
    });

    await client.query(
      'UPDATE manual_calendar_blocks SET deleted_at = NOW() WHERE id = $1',
      [req.params.id]
    );

    await writeAuditLog(client, {
      action: 'MANUAL_BLOCK_DELETED',
      actor_id: req.user.sub,
      target_type: 'manual_block',
      target_id: req.params.id,
      meta: { title: block.title, freed_approved_bookings: covered.map(b => b.id) }
    });

    await client.query('COMMIT');
    res.json({
      message: 'Deleted successfully',
      freed_approved_bookings: covered.length
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('deleteBlock error:', error);
    res.status(500).json({ error: 'Internal error' });
  } finally {
    client.release();
  }
};

exports.getConflicts = async (req, res) => {
  res.json({ data: [] });
};
