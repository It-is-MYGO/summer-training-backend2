// 收藏相关数据库操作（MySQL）
const { pool } = require('../../../lib/database/connection');

module.exports = {
  async findAll(userId) {
    const [rows] = await pool.query(`
SELECT 
  f.id,
  f.product_id,
  f.alert_price,
  p.title,
  p.img,
  pp.price,
  (pp.price - f.alert_price) as price_change
FROM favorites f
JOIN (
  SELECT MAX(id) as max_id
  FROM favorites
  WHERE user_id = ?
  GROUP BY product_id
) latest_fav ON f.id = latest_fav.max_id
JOIN products p ON f.product_id = p.id
LEFT JOIN (
  SELECT p1.product_id, MIN(p1.price) as price
  FROM product_prices p1
  WHERE p1.date = (
    SELECT MAX(p2.date)
    FROM product_prices p2
    WHERE p2.product_id = p1.product_id
  )
  GROUP BY p1.product_id
) pp ON f.product_id = pp.product_id
WHERE f.user_id = ?
ORDER BY f.id DESC
    `, [userId, userId]);
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
    try {
      const [result] = await pool.query(
        'INSERT INTO favorites (user_id, product_id, alert_price) VALUES (?, ?, ?)',
        [userId, productId, 0]
      );
      return result;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        const [existRows] = await pool.query(
          'SELECT id FROM favorites WHERE user_id = ? AND product_id = ?',
          [userId, productId]
        );
        return { duplicate: true, id: existRows[0]?.id };
      }
      throw err;
    }
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
  },

  async checkFavorite(userId, productId) {
    const [rows] = await pool.query(
      'SELECT id FROM favorites WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
    if (rows.length > 0) {
      return { exists: true, id: rows[0].id };
    } else {
      return { exists: false };
    }
  }
}; 