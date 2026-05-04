if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
}
const express = require('express');
const morgan  = require('morgan');
const { Pool } = require('pg');
const { requireAuth } = require('../../shared/middleware/auth');

const app  = express();
const PORT = process.env.NOTIF_SERVICE_PORT || 8013;

app.use(morgan('dev'));
app.use(express.json());

let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
  });
} else {
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost', 
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'class_booking',
    user: process.env.DB_USER || 'postgres', 
    password: process.env.DB_PASSWORD || 'postgres',
    max: 10,
  });
}

pool.on('error', (err) => console.error('DB pool error:', err));

// In-memory SSE client registry: Map<userId, Response[]>
const sseClients = new Map();

function sendSSE(rawUserId, data) {
  const userId = String(rawUserId);
  const clients = sseClients.get(userId) || [];
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(res => { try { res.write(payload); } catch {} });
}

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'notification-service' }));

// GET /api/notifications/stream — SSE endpoint
app.get('/api/notifications/stream', (req, res) => {
  const rawUserId = req.query.userId || req.headers['x-user-id'];
  if (!rawUserId) return res.status(401).json({ error: 'Unauthorized' });
  const userId = String(rawUserId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients.has(userId)) sseClients.set(userId, []);
  sseClients.get(userId).push(res);

  // Send connected event
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE connected', userId })}\n\n`);

  req.on('close', () => {
    const updated = (sseClients.get(userId) || []).filter(r => r !== res);
    if (updated.length) sseClients.set(userId, updated);
    else sseClients.delete(userId);
  });
});

// GET /api/notifications — list for current user
app.get('/api/notifications', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { rows } = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [userId]
  );
  const unreadCount = rows.filter(n => !n.is_read).length;
  res.json({ data: rows, unread: unreadCount });
});

// PATCH /api/notifications/:id/read
app.patch('/api/notifications/:id/read', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { rowCount } = await pool.query(
    `UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = $1 AND user_id = $2`,
    [req.params.id, userId]
  );
  
  if (rowCount > 0) {
    const { rows } = await pool.query(`SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE`, [userId]);
    const unreadCount = parseInt(rows[0].count);
    sendSSE(userId, { type: 'READ_COUNT_UPDATED', unreadCount });
  }
  
  res.json({ message: 'Marked as read' });
});

// DELETE /api/notifications/read
app.delete('/api/notifications/read', requireAuth, async (req, res) => {
  const userId = req.user.id;
  await pool.query(`DELETE FROM notifications WHERE user_id = $1 AND is_read = TRUE`, [userId]);
  res.json({ message: 'Read notifications cleared' });
});

// DELETE /api/notifications/:id
app.delete('/api/notifications/:id', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { rowCount } = await pool.query(
    `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
    [req.params.id, userId]
  );

  if (rowCount > 0) {
    const { rows } = await pool.query(`SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE`, [userId]);
    const unreadCount = parseInt(rows[0].count);
    sendSSE(userId, { type: 'READ_COUNT_UPDATED', unreadCount });
  }

  res.json({ message: 'Notification deleted' });
});

// PATCH /api/notifications/read-all
app.patch('/api/notifications/read-all', requireAuth, async (req, res) => {
  const userId = req.user.id;
  await pool.query(`UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = $1 AND is_read = FALSE`, [userId]);
  sendSSE(userId, { type: 'READ_COUNT_UPDATED', unreadCount: 0 });
  res.json({ message: 'All marked as read' });
});

// POST /api/notifications/internal — called by booking-service (internal only)
app.post('/api/notifications/internal', async (req, res) => {
  const { user_id, booking_id, type, title, message } = req.body;
  if (!user_id || !type || !title || !message)
    return res.status(400).json({ error: 'user_id, type, title, message required' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, booking_id, type, title, message)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [user_id, booking_id || null, type, title, message]
    );
    
    const { rows: countRows } = await pool.query(`SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE`, [user_id]);
    const unreadCount = parseInt(countRows[0].count);
    
    sendSSE(user_id, { type: 'NOTIFICATION', notification: rows[0], unreadCount });
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🔔 Notification Service on port ${PORT}`));
}

module.exports = app;
