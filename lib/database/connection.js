const mysql = require('mysql2/promise');
const dbConfig = require('../../config/database');

const pool = mysql.createPool(dbConfig);

async function connectDB() {
  try {
    const conn = await pool.getConnection();
    console.log('Database connected');
    conn.release();
  } catch (err) {
    console.error('Database connection failed:', err);
    throw err;
  }
}

module.exports = { pool, connectDB };