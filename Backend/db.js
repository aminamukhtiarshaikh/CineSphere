const { Pool } = require('pg');
require('dotenv').config();

const url = process.env.DATABASE_URL || '';
const isLocal = url.includes('localhost') || url.includes('127.0.0.1') || url.includes('host=/');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

pool.connect()
  .then(client => {
    console.log('✅ Connected to Neon PostgreSQL.');
    client.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('   -> Check DATABASE_URL in your .env file (copy a fresh one from the Neon dashboard).');
  });

module.exports = pool;
