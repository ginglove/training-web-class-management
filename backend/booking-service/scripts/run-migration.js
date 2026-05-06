#!/usr/bin/env node
/**
 * run-migration.js
 * Runs a SQL migration file using the booking-service db pool.
 * Usage: node run-migration.js <path-to-migration.sql>
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('Usage: node run-migration.js <migration.sql>');
  process.exit(1);
}

const sql = fs.readFileSync(path.resolve(sqlFile), 'utf8');

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME     || 'class_booking',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

(async () => {
  const client = await pool.connect();
  try {
    console.log(`🔄 Running migration: ${sqlFile}`);
    await client.query(sql);
    console.log('✅ Migration applied successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
