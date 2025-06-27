// 商品价格表（MySQL）
const { pool } = require('../../../lib/database/connection');

class ProductPrice {
  static async findAll(options = {}) {
    let sql = 'SELECT * FROM product_prices';
    const params = [];
    
    if (options.where) {
      const conditions = [];
      for (const [key, value] of Object.entries(options.where)) {
        if (key === 'product_id') {
          conditions.push('product_id = ?');
          params.push(value);
        } else if (key === 'platform') {
          conditions.push('platform = ?');
          params.push(value);
        }
      }
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
    }
    
    if (options.order) {
      sql += ' ORDER BY ' + options.order.map(item => `${item[0]} ${item[1]}`).join(', ');
    }
    
    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }
    
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  static async findPriceHistory(productId) {
    const [rows] = await pool.query(
      'SELECT * FROM product_prices WHERE product_id = ? ORDER BY date ASC',
      [productId]
    );
    return rows;
  }

  static async findPlatformPrices(productId) {
    // 获取各平台最新价格
    const [rows] = await pool.query(`
      SELECT p1.* FROM product_prices p1
      INNER JOIN (
        SELECT platform, MAX(date) as max_date
        FROM product_prices 
        WHERE product_id = ?
        GROUP BY platform
      ) p2 ON p1.platform = p2.platform AND p1.date = p2.max_date
      WHERE p1.product_id = ?
    `, [productId, productId]);
    return rows;
  }

  static async findChartData(productId) {
    // 获取最近30天的价格数据，按平台分组
    const [rows] = await pool.query(`
      SELECT platform, date, price 
      FROM product_prices 
      WHERE product_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ORDER BY platform, date ASC
    `, [productId]);
    
    // 按平台分组数据
    const platformData = {};
    rows.forEach(row => {
      if (!platformData[row.platform]) {
        platformData[row.platform] = [];
      }
      platformData[row.platform].push({
        date: row.date,
        price: parseFloat(row.price)
      });
    });
    
    return platformData;
  }

  static async findMonthlyAverage(productId) {
    // 获取每月平均价格
    const [rows] = await pool.query(`
      SELECT 
        YEAR(date) as year,
        MONTH(date) as month,
        AVG(price) as avg_price
      FROM product_prices 
      WHERE product_id = ?
      GROUP BY YEAR(date), MONTH(date)
      ORDER BY year, month
    `, [productId]);
    
    return rows.map(row => ({
      month: `${row.year}-${row.month.toString().padStart(2, '0')}`,
      avgPrice: parseFloat(row.avg_price)
    }));
  }
}

module.exports = ProductPrice;
