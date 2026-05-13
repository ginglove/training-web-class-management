const { Pool } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  database: 'class_booking',
  user: 'postgres',
  password: 'postgres',
};

const pool = new Pool(config);

async function check() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connection successful:', res.rows[0]);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  } finally {
    await pool.end();
  }
}

check();
