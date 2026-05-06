const { Client } = require('pg');
require('dotenv').config();
async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(`
      DO \$\$ BEGIN
        CREATE TYPE block_type AS ENUM ('MAINTENANCE', 'HOLIDAY', 'EVENT', 'OTHER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END \$\$;

      CREATE TABLE IF NOT EXISTS manual_calendar_blocks (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        class_id        UUID REFERENCES classes(id) ON DELETE CASCADE,
        created_by      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        block_type      block_type NOT NULL,
        title           VARCHAR(200) NOT NULL,
        description     TEXT,
        start_datetime  TIMESTAMPTZ NOT NULL,
        end_datetime    TIMESTAMPTZ NOT NULL,
        is_all_day      BOOLEAN NOT NULL DEFAULT FALSE,
        recurrence_rule VARCHAR(200),
        color           VARCHAR(7),
        affected_bookings UUID[],
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at      TIMESTAMPTZ,
        CHECK (end_datetime > start_datetime)
      );

      CREATE INDEX IF NOT EXISTS idx_manual_blocks_class ON manual_calendar_blocks(class_id);
      CREATE INDEX IF NOT EXISTS idx_manual_blocks_time  ON manual_calendar_blocks(start_datetime, end_datetime);
    `);
    console.log('Successfully created manual_calendar_blocks');
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
