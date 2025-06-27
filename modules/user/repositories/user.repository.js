const { pool } = require('../../../lib/database/connection'); // 使用公共的数据库连接池

class UserRepository {
  async getUserByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ?';
    const [rows] = await pool.query(sql, [username]);
    return rows[0] || null;
  }

  async createUser(username, password, email) {
    try {
      const sql = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
      const [result] = await pool.query(sql, [username, password, email]);
      console.log('新用户插入成功，ID:', result.insertId);
      return result.insertId;
    } catch (err) {
      console.error('插入用户时出错:', err);
      throw err;
    }
  }

  async findByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ?';
    const [rows] = await pool.query(sql, [username]);
    return rows[0] || null;
  }
}

module.exports = new UserRepository();