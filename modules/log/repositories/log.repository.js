const { pool } = require('../../../lib/database/connection');

module.exports = {
  // 新增用户日志，单用户最多100条，超出自动覆盖最早的
  async createLog(userId, action, status, ip, userAgent) {
    const MAX_LOGS_PER_USER = 100;
    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM user_logs WHERE user_id = ?', [userId]);
    if (count >= MAX_LOGS_PER_USER) {
      await pool.query('DELETE FROM user_logs WHERE user_id = ? ORDER BY created_at ASC LIMIT 1', [userId]);
    }
    await pool.query(
      'INSERT INTO user_logs (user_id, action, status, ip, user_agent) VALUES (?, ?, ?, ?, ?)',
      [userId, action, status, ip, userAgent]
    );
  },

  // 查询用户日志
  async getLogs({ userId, action, page = 1, pageSize = 20 }) {
    let where = [];
    let params = [];
    if (userId) { where.push('user_id = ?'); params.push(userId); }
    if (action) { where.push('action = ?'); params.push(action); }
    const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const offset = (page - 1) * pageSize;

    // 查询分页数据
    const [rows] = await pool.query(
      `SELECT * FROM user_logs ${whereStr} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), Number(offset)]
    );
    // 查询总数
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM user_logs ${whereStr}`,
      params
    );
    const total = countRows[0]?.total || 0;
    return { rows, total };
  }
}; 