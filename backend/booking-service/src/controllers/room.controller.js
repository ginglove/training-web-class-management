const pool = require('../db');

// GET /rooms
async function list(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM classes WHERE status = 'AVAILABLE' ORDER BY name`
    );
    res.json(rows);
  } catch (err) { next(err); }
}

// GET /rooms/:id
async function getById(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT * FROM classes WHERE id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Room not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// GET /rooms/:id/availability?date=YYYY-MM-DD
async function getAvailability(req, res, next) {
  try {
    const { id }  = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' });

    const { rows } = await pool.query(
      `SELECT ts.id AS slot_id, ts.slot_name, ts.start_time, ts.end_time,
              b.id  AS booking_id, b.status AS booking_status,
              b.purpose, u.full_name AS booked_by
       FROM time_slots ts
       LEFT JOIN bookings b ON b.slot_id = ts.id AND b.class_id = $1 AND b.date = $2
         AND b.status NOT IN ('CANCELLED','REJECTED')
       LEFT JOIN users u ON b.creator_id = u.id
       ORDER BY ts.sort_order`,
      [id, date]
    );

    res.json({ class_id: id, date, slots: rows });
  } catch (err) { next(err); }
}

// GET /rooms/availability/all?date=YYYY-MM-DD
async function getAllAvailability(req, res, next) {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date required' });

    const { rows } = await pool.query(
      `SELECT * FROM room_slot_usage WHERE date = $1 OR date IS NULL ORDER BY class_name, start_time`,
      [date]
    );
    res.json({ date, data: rows });
  } catch (err) { next(err); }
}

module.exports = { list, getById, getAvailability, getAllAvailability };
