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

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, username, email FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  async updateById(id, updateData) {
    const [result] = await pool.query(
      'UPDATE users SET ? WHERE id = ?',
      [updateData, id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = new AuthRepository();