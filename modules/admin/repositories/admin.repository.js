const { pool } = require('../../../lib/database/connection');

// 测试数据库连接
async function testConnection() {
  try {
    const [rows] = await pool.execute('SELECT 1 as test');
    console.log('✅ 数据库连接测试成功:', rows);
    return true;
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error);
    return false;
  }
}

// 获取价格趋势数据
async function getPriceTrends(startDate, endDate, category) {
  try {
    console.log('🔍 开始查询价格趋势数据...');
    console.log('参数:', { startDate, endDate, category });
    
    // 先测试数据库连接
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('数据库连接失败');
    }
    
    // 先尝试简单的查询
    console.log('测试简单查询...');
    const [testRows] = await pool.execute('SELECT COUNT(*) as count FROM products');
    console.log('products表记录数:', testRows[0].count);
    
    const [testPriceRows] = await pool.execute('SELECT COUNT(*) as count FROM product_prices');
    console.log('product_prices表记录数:', testPriceRows[0].count);
    
    let query = `
      SELECT 
        pp.date,
        pp.price,
        pp.platform,
        pp.url,
        p.id as product_id,
        p.title,
        p.category
      FROM product_prices pp
      JOIN products p ON pp.product_id = p.id
      WHERE pp.date BETWEEN ? AND ?
    `;
    
    const params = [startDate, endDate];
    
    if (category) {
      query += ' AND p.category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY pp.date ASC, p.category ASC';
    
    console.log('执行查询:', query);
    console.log('查询参数:', params);
    
    const [rows] = await pool.execute(query, params);
    console.log('查询结果条数:', rows.length);
    
    return rows;
  } catch (error) {
    console.error('查询价格趋势数据失败:', error);
    console.error('错误堆栈:', error.stack);
    throw error;
  }
}

// 获取用户活跃度分布
async function getUserActivityDistribution() {
  try {
    const query = `
      SELECT 
        CASE 
          WHEN login_count >= 10 THEN '高活跃用户'
          WHEN login_count >= 5 THEN '中等活跃用户'
          WHEN login_count >= 2 THEN '低活跃用户'
          ELSE '新用户'
        END as activity_level,
        COUNT(*) as count
      FROM (
        SELECT user_id, COUNT(*) as login_count
        FROM user_logs 
        WHERE action = 'login' 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY user_id
      ) user_activity
      GROUP BY activity_level
    `;
    
    const [rows] = await pool.execute(query);
    return rows.map(row => ({
      name: row.activity_level,
      value: row.count
    }));
  } catch (error) {
    console.error('查询用户活跃度分布失败:', error);
    throw error;
  }
}

// 获取商品类别分布
async function getProductCategoryDistribution() {
  try {
    const query = `
      SELECT 
        COALESCE(category, '未分类') as category,
        COUNT(*) as count
      FROM products 
      WHERE status = 1
      GROUP BY category
      ORDER BY count DESC
    `;
    
    const [rows] = await pool.execute(query);
    return rows;
  } catch (error) {
    console.error('查询商品类别分布失败:', error);
    throw error;
  }
}

// 获取平台商品数量对比（按分类分组，基于所有商品最新价格）
async function getPlatformComparison() {
  try {
    const query = `
      SELECT 
        COALESCE(p.category, '未分类') as category,
        platforms.platform,
        COUNT(*) as product_count
      FROM products p
      LEFT JOIN (
        SELECT product_id, platform
        FROM (
          SELECT product_id, platform,
                 ROW_NUMBER() OVER (PARTITION BY product_id, platform ORDER BY date DESC, id DESC) as rn
          FROM product_prices
        ) t
        WHERE rn = 1
      ) platforms ON p.id = platforms.product_id
      WHERE p.status = 1
      GROUP BY category, platforms.platform
    `;
    const [rows] = await pool.execute(query);
    // 整理为 {category, 京东, 天猫, 拼多多, 苏宁}
    const categories = {};
    rows.forEach(row => {
      if (!categories[row.category]) {
        categories[row.category] = { category: row.category, 京东: 0, 天猫: 0, 拼多多: 0, 苏宁: 0 };
      }
      if (row.platform) {
        categories[row.category][row.platform] = row.product_count;
      }
    });
    return Object.values(categories);
  } catch (error) {
    console.error('查询平台对比数据失败:', error);
    throw error;
  }
}

module.exports = {
  getPriceTrends,
  getUserActivityDistribution,
  getProductCategoryDistribution,
  getPlatformComparison
}; 