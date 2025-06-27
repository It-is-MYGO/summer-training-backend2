const pool = require('../../../lib/database/connection')// 使用公共的数据库连接池

class UserRepository {
  async getUserByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ?';
    const [rows] = await pool.query(sql, [username]);
    return rows[0] || null;
  }

  async createUser(username, password, email) {
    const sql = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
    const [result] = await pool.query(sql, [username, password, email]);
    return result.insertId;
  }
}

module.exports = new UserRepository();