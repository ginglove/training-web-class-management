const { Pool } = require('pg');

let pool;

if (process.env.DATABASE_URL) {
  // Use Neon / Vercel DATABASE_URL connection string with SSL
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
  });
} else {
  // Fallback to local Docker setup
  pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME     || 'class_booking',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 10,
  });
}

pool.on('error', (err) => console.error('DB pool error:', err));

module.exports = pool;
