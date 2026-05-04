const pool = require('../db');

/**
 * Adds an entry to the booking_logs table.
 * @param {import('pg').PoolClient|import('pg').Pool} client - DB client or pool
 * @param {Object} data - Log data
 * @param {string} data.bookingId - UUID of the booking
 * @param {string} data.actorId - UUID of the user performing the action
 * @param {string|null} data.fromStatus - Previous status
 * @param {string} data.toStatus - New status
 * @param {string} data.comment - Rationale for the change
 */
async function addLog(client, { bookingId, actorId, fromStatus, toStatus, comment }) {
  await client.query(
    `INSERT INTO booking_logs (booking_id, actor_id, from_status, to_status, comment)
     VALUES ($1,$2,$3,$4,$5)`,
    [bookingId, actorId, fromStatus, toStatus, comment]
  );
}

module.exports = { addLog };
