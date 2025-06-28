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
    try {
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
          price: parseFloat(row.price) || 0
        });
      });
      
      // 确保每个平台都有连续的数据点（如果没有数据，填充默认值）
      const platforms = Object.keys(platformData);
      if (platforms.length > 0) {
        const allDates = new Set();
        rows.forEach(row => allDates.add(row.date));
        const sortedDates = Array.from(allDates).sort();
        
        platforms.forEach(platform => {
          const existingDates = new Set(platformData[platform].map(item => item.date));
          sortedDates.forEach(date => {
            if (!existingDates.has(date)) {
              // 如果没有该日期的数据，使用前一个价格或默认值
              const lastPrice = platformData[platform].length > 0 
                ? platformData[platform][platformData[platform].length - 1].price 
                : 0;
              platformData[platform].push({
                date: date,
                price: lastPrice
              });
            }
          });
          // 重新排序
          platformData[platform].sort((a, b) => new Date(a.date) - new Date(b.date));
        });
      }
      
      return platformData;
    } catch (error) {
      console.error('获取图表数据失败:', error);
      throw error;
    }
  }

  static async findMonthlyAverage(productId) {
    try {
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
        month: `${row.year}-${String(row.month).padStart(2, '0')}`,
        avgPrice: parseFloat(row.avg_price) || 0
      }));
    } catch (error) {
      console.error('获取月度平均价格失败:', error);
      throw error;
    }
  }

  // 新增：获取价格波动统计
  static async findPriceFluctuation(productId) {
    try {
      const [rows] = await pool.query(`
        SELECT 
          platform,
          MIN(price) as min_price,
          MAX(price) as max_price,
          AVG(price) as avg_price,
          COUNT(*) as data_points
        FROM product_prices 
        WHERE product_id = ?
        GROUP BY platform
      `, [productId]);
      
      return rows.map(row => ({
        platform: row.platform,
        minPrice: parseFloat(row.min_price) || 0,
        maxPrice: parseFloat(row.max_price) || 0,
        avgPrice: parseFloat(row.avg_price) || 0,
        dataPoints: parseInt(row.data_points) || 0,
        fluctuation: parseFloat(row.max_price) - parseFloat(row.min_price)
      }));
    } catch (error) {
      console.error('获取价格波动统计失败:', error);
      throw error;
    }
  }

  // 新增：获取最近价格变化趋势
  static async findRecentPriceTrend(productId, days = 7) {
    try {
      const [rows] = await pool.query(`
        SELECT 
          platform,
          date,
          price,
          LAG(price) OVER (PARTITION BY platform ORDER BY date) as prev_price
        FROM product_prices 
        WHERE product_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        ORDER BY platform, date DESC
      `, [productId, days]);
      
      const trends = {};
      rows.forEach(row => {
        if (!trends[row.platform]) {
          trends[row.platform] = [];
        }
        
        const currentPrice = parseFloat(row.price) || 0;
        const prevPrice = parseFloat(row.prev_price) || currentPrice;
        const change = currentPrice - prevPrice;
        const changePercent = prevPrice > 0 ? (change / prevPrice) * 100 : 0;
        
        trends[row.platform].push({
          date: row.date,
          price: currentPrice,
          change: change,
          changePercent: changePercent,
          trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
        });
      });
      
      return trends;
    } catch (error) {
      console.error('获取价格趋势失败:', error);
      throw error;
    }
  }
}

module.exports = ProductPrice;
