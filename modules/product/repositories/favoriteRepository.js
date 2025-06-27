// 收藏相关数据库操作（MySQL）
const { pool } = require('../../../lib/database/connection');

module.exports = {
  async findByUserId(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM favorites WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );
    return rows;
  },

  async findByUserAndProduct(userId, productId) {
    const [rows] = await pool.query(
      'SELECT * FROM favorites WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
    return rows[0];
  },

  async findProductById(productId) {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );
    return rows[0];
  },

  async findLatestPrice(productId) {
    const [rows] = await pool.query(`
      SELECT * FROM product_prices 
      WHERE product_id = ? 
      ORDER BY date DESC 
      LIMIT 1
    `, [productId]);
    return rows[0];
  },

  async create(favoriteData) {
    const [result] = await pool.query(
      'INSERT INTO favorites SET ?',
      [favoriteData]
    );
    return result;
  },

  async deleteById(userId, favoriteId) {
    const [result] = await pool.query(
      'DELETE FROM favorites WHERE id = ? AND user_id = ?',
      [favoriteId, userId]
    );
    return result;
  },

  async updateAlertPrice(userId, favoriteId, alertPrice) {
    const [result] = await pool.query(
      'UPDATE favorites SET alert_price = ? WHERE id = ? AND user_id = ?',
      [alertPrice, favoriteId, userId]
    );
    return result;
  }
}; 