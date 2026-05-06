const { Pool } = require('pg');

let pool;

let dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  if (dbUrl.includes('sslmode=require')) {
    dbUrl = dbUrl.replace('sslmode=require', 'sslmode=verify-full');
  } else if (!dbUrl.includes('sslmode=')) {
    dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'sslmode=verify-full';
  }
}

const config = dbUrl 
  ? { connectionString: dbUrl, ssl: { rejectUnauthorized: false } }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME     || 'class_booking',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };

console.log(`🔌 [Auth Service] Connecting to DB: ${config.host}:${config.port}/${config.database} as ${config.user}`);

pool = new Pool({ ...config, max: 10 });

// Run a quick diagnostic
pool.query('SELECT current_database(), current_schema(), current_user')
  .then(res => {
    const { current_database, current_schema, current_user } = res.rows[0];
    console.log(`✅ [Auth Service] Connected! DB: ${current_database}, Schema: ${current_schema}, User: ${current_user}`);
    
    return pool.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'");
  })
  .then(res => {
    const tables = res.rows.map(r => r.tablename);
    console.log(`📋 [Auth Service] Visible tables: [${tables.join(', ')}]`);
    if (tables.length === 0) {
      console.error('⚠️ [Auth Service] WARNING: No tables found! Your database might be empty or you might be in the wrong schema.');
    }
  })
  .catch(err => console.error('❌ [Auth Service] DB Diagnostic failed:', err.message));

pool.on('error', (err) => console.error('DB pool error:', err));

module.exports = pool;
