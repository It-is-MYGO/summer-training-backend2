const { pool } = require('../../../lib/database/connection'); // 使用公共的数据库连接池

class UserRepository {
  async getUserByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ?';
    const [rows] = await pool.query(sql, [username]);
    return rows[0] || null;
  }

  async createUser(username, password, email, isadmin = 0) {
    try {
      const sql = 'INSERT INTO users (username, password, email, isadmin) VALUES (?, ?, ?, ?)';
      const [result] = await pool.query(sql, [username, password, email, isadmin]);
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

  async findById(id) {
    const sql = 'SELECT * FROM users WHERE id = ?';
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  }

  async updateById(id, updateData) {
    try {
      const fields = [];
      const values = [];
      
      if (updateData.email !== undefined) {
        fields.push('email = ?');
        values.push(updateData.email);
      }
      
      if (updateData.password !== undefined) {
        fields.push('password = ?');
        values.push(updateData.password); // 使用明文密码
      }
      
      if (fields.length === 0) {
        return false;
      }
      
      values.push(id);
      const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      const [result] = await pool.query(sql, values);
      
      return result.affectedRows > 0;
    } catch (err) {
      console.error('更新用户信息时出错:', err);
      throw err;
    }
  }

  async updateAvatar(id, avatarUrl) {
    try {
      const sql = 'UPDATE users SET avatar = ? WHERE id = ?';
      const [result] = await pool.query(sql, [avatarUrl, id]);
      
      return result.affectedRows > 0;
    } catch (err) {
      console.error('更新用户头像时出错:', err);
      throw err;
    }
  }

  async getAllUsers() {
    const sql = 'SELECT id, username, email, isadmin, avatar, status FROM users';
    const [rows] = await pool.query(sql);
    return rows;
  }

  async updateUserAdminStatus(id, { isadmin, status }) {
    const fields = [];
    const values = [];
    if (isadmin !== undefined) {
      fields.push('isadmin = ?');
      values.push(isadmin);
    }
    if (status !== undefined) {
      fields.push('status = ?');
      values.push(status);
    }
    if (fields.length === 0) return false;
    values.push(id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await pool.query(sql, values);
    return result.affectedRows > 0;
  }

  async deleteUser(id) {
    const sql = 'DELETE FROM users WHERE id = ?';
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows > 0;
  }

  async increaseActivity(userId) {
    const sql = 'UPDATE users SET activity = activity + 1 WHERE id = ?';
    const [result] = await pool.query(sql, [userId]);
    return result.affectedRows > 0;
  }

  async getActivityDistribution() {
    // 活跃度分布区间可根据实际需求调整
    // 例：高活跃(>100)、中等(51-100)、低(11-50)、新用户(<=10)
    const sql = `
      SELECT
        SUM(CASE WHEN activity > 100 THEN 1 ELSE 0 END) AS high,
        SUM(CASE WHEN activity BETWEEN 51 AND 100 THEN 1 ELSE 0 END) AS medium,
        SUM(CASE WHEN activity BETWEEN 11 AND 50 THEN 1 ELSE 0 END) AS low,
        SUM(CASE WHEN activity <= 10 THEN 1 ELSE 0 END) AS new_user
      FROM users
    `;
    const [rows] = await pool.query(sql);
    return rows[0];
  }

  async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await pool.query(sql, [email]);
    return rows[0] || null;
  }
}

module.exports = new UserRepository();