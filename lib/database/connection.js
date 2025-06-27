const mysql = require('mysql2/promise');
const dbConfig = require('../../config/database');

const pool = mysql.createPool(dbConfig);

// 测试连接
pool.getConnection()
  .then(conn => {
    console.log('Database connected');
    conn.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err);
  });

module.exports = { pool };