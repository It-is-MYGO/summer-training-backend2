const { sequelize } = require('../../../config/db');
const { QueryTypes } = require('sequelize');

class ChartRepository {
  /**
   * 获取用户活动统计（最近7天注册用户数）
   * @returns {Promise<Array>}
   */
  async getUserActivityStats() {
    const query = `
      SELECT 
        DATE(created_at) AS date,
        COUNT(*) AS user_count
      FROM users
      WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    return await sequelize.query(query, { type: QueryTypes.SELECT });
  }

  /**
   * 获取商品分类统计
   * @returns {Promise<Array>}
   */
  async getProductCategoryStats() {
    const query = `
      SELECT 
        category,
        COUNT(*) AS product_count,
        ROUND(AVG(price), 2) AS avg_price
      FROM products
      LEFT JOIN (
        SELECT product_id, price 
        FROM product_prices 
        WHERE date = (SELECT MAX(date) FROM product_prices)
      ) AS latest_prices ON products.id = latest_prices.product_id
      GROUP BY category
      HAVING category IS NOT NULL
    `;
    return await sequelize.query(query, { type: QueryTypes.SELECT });
  }

  /**
   * 获取价格趋势统计（最近30天）
   * @returns {Promise<Array>}
   */
  async getPriceTrendStats() {
    const query = `
      SELECT 
        date,
        platform,
        ROUND(AVG(price), 2) AS avg_price
      FROM product_prices
      WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
      GROUP BY date, platform
      ORDER BY date ASC
    `;
    return await sequelize.query(query, { type: QueryTypes.SELECT });
  }

  /**
   * 获取平台比价统计
   * @returns {Promise<Array>}
   */
  async getPlatformComparisonStats() {
    const query = `
      SELECT 
        pp.platform,
        COUNT(DISTINCT pp.product_id) AS product_count,
        ROUND(MIN(pp.price), 2) AS min_price,
        ROUND(AVG(pp.price), 2) AS avg_price,
        ROUND(MAX(pp.price), 2) AS max_price
      FROM product_prices pp
      INNER JOIN (
        SELECT product_id, MAX(date) AS latest_date
        FROM product_prices
        GROUP BY product_id
      ) AS latest ON pp.product_id = latest.product_id AND pp.date = latest.latest_date
      GROUP BY pp.platform
    `;
    return await sequelize.query(query, { type: QueryTypes.SELECT });
  }

  /**
   * 获取热门商品统计
   * @param {number} limit 返回数量
   * @returns {Promise<Array>}
   */
  async getHotProductsStats(limit = 5) {
    const query = `
      SELECT 
        p.id,
        p.title,
        p.category,
        COUNT(f.id) AS favorite_count
      FROM products p
      LEFT JOIN favorites f ON p.id = f.product_id
      WHERE p.is_hot = true
      GROUP BY p.id
      ORDER BY favorite_count DESC
      LIMIT :limit
    `;
    return await sequelize.query(query, { 
      replacements: { limit },
      type: QueryTypes.SELECT 
    });
  }
}

module.exports = new ChartRepository();