// 收藏相关数据库操作（MySQL）
const { pool } = require('../../../lib/database/connection');

module.exports = {
  async findAll() {
    const [rows] = await pool.query(`
      SELECT 
        f.id,
        f.product_id,
        f.alert_price,
        p.title,
        p.price,
        p.img,
        (p.price - f.alert_price) as price_change
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      ORDER BY f.created_at DESC
    `);
    
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      price: row.price,
      priceChange: parseFloat(row.price_change) || 0,
      alertPrice: parseFloat(row.alert_price) || 0,
      img: row.img
    }));
  },

  async create(productId, userId) {
    const [result] = await pool.query(
      'INSERT INTO favorites (user_id, product_id, alert_price) VALUES (?, ?, ?)',
      [userId, productId, 0]
    );
    return result;
  },

  async delete(id) {
    const [result] = await pool.query(
      'DELETE FROM favorites WHERE id = ?',
      [id]
    );
    return result;
  },

  async updateAlertPrice(id, alertPrice) {
    const [result] = await pool.query(
      'UPDATE favorites SET alert_price = ? WHERE id = ?',
      [alertPrice, id]
    );
    return result;
  }
}; 