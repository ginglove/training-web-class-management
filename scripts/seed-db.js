const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load environment variables from the root .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function seedDatabase() {
  const clientConfig = process.env.DATABASE_URL 
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'class_booking',
      };

  const client = new Client(clientConfig);

  try {
    console.log('Connecting to database...');
    await client.connect();

    console.log('Reading schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
    
    console.log('Reading seed.sql...');
    const seedSql = fs.readFileSync(path.join(__dirname, '../database/seed.sql'), 'utf8');

    console.log('Applying schema...');
    await client.query(schemaSql);
    
    console.log('Applying seed data...');
    await client.query(seedSql);

    console.log('Database seeded successfully! 🎉');
  } catch (error) {
    console.error('Error seeding database:', error.message);
  } finally {
    await client.end();
  }
}

seedDatabase();
