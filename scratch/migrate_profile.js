const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

let dbUrl = process.env.DATABASE_URL;
const config = dbUrl 
  ? { connectionString: dbUrl, ssl: { rejectUnauthorized: false } }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME     || 'class_booking',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };

const pool = new Pool(config);

async function migrate() {
  try {
    console.log('🚀 Starting profile migrations...');
    
    // 1. Update refresh_tokens
    await pool.query(`
      ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
      ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS user_agent TEXT;
    `);
    console.log('✅ Updated refresh_tokens table');

    // 2. Create login_activity table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS login_activity (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ip_address  VARCHAR(45),
        user_agent  TEXT,
        status      VARCHAR(20) NOT NULL, -- 'SUCCESS', 'FAILED'
        failure_reason TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_login_activity_user ON login_activity(user_id);
    `);
    console.log('✅ Created login_activity table');

    console.log('✨ All migrations completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
