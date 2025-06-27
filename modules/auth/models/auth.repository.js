const { pool } = require('../../../lib/database/connection');

class AuthRepository {
  async findByUsername(username) {
    const [rows] = await pool.query(
      'SELECT id, username, password, email FROM users WHERE username = ?', 
      [username]
    );
    return rows[0];
  }

  async create(userData) {
    const [result] = await pool.query(
      'INSERT INTO users SET ?',
      [userData]
    );
    return result.insertId;
  }
}

module.exports = new AuthRepository();