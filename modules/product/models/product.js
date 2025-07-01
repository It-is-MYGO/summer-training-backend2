// 商品数据模型定义（MySQL）
const { pool } = require('../../../lib/database/connection');

class Product {
  static async findAll(options = {}) {
    let sql = 'SELECT * FROM products';
    const params = [];
    
    if (options.where) {
      const conditions = [];
      for (const [key, value] of Object.entries(options.where)) {
        if (key === 'name' && value) {
          conditions.push('title LIKE ?');
          params.push(`%${value}%`);
        } else if (key === 'isHot') {
          conditions.push('is_hot = ?');
          params.push(value ? 1 : 0);
        } else if (key === 'isDrop') {
          conditions.push('is_drop = ?');
          params.push(value ? 1 : 0);
        }
      }
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
    }
    
    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }
    
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0];
  }

  static async findHotProducts() {
    const [rows] = await pool.query('SELECT * FROM products WHERE is_hot = 1 AND status = 1 LIMIT 10');
    return rows;
  }

  static async findDropProducts() {
    const [rows] = await pool.query('SELECT * FROM products WHERE is_drop = 1 AND status = 1 LIMIT 10');
    return rows;
  }

  static async findByKeyword(keyword) {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE status = 1 AND (title LIKE ? OR `desc` LIKE ?)',
      [`%${keyword}%`, `%${keyword}%`]
    );
    return rows;
  }

  static async findAllWithFavoriteCount() {
    const [rows] = await pool.query(`
      SELECT 
        p.*,
        COALESCE(fav_count.favorite_count, 0) as favorite_count
      FROM products p
      LEFT JOIN (
        SELECT 
          product_id,
          COUNT(*) as favorite_count
        FROM favorites
        GROUP BY product_id
      ) fav_count ON p.id = fav_count.product_id
      ORDER BY p.id DESC
    `);
    return rows;
  }

  static async findAllWithFavoriteCountPaged(page = 1, pageSize = 10) {
    const offset = (page - 1) * pageSize;
    // 查询总数
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM products');
    // 查询分页数据，带最新价格和平台
    const [rows] = await pool.query(`
      SELECT 
        p.*,
        COALESCE(fav_count.favorite_count, 0) as favorite_count,
        pp.platform,
        pp.price
      FROM products p
      LEFT JOIN (
        SELECT 
          product_id,
          COUNT(*) as favorite_count
        FROM favorites
        GROUP BY product_id
      ) fav_count ON p.id = fav_count.product_id
      LEFT JOIN (
        SELECT t1.product_id, t1.platform, t1.price
        FROM product_prices t1
        INNER JOIN (
          SELECT product_id, MAX(date) as max_date
          FROM product_prices
          GROUP BY product_id
        ) t2 ON t1.product_id = t2.product_id AND t1.date = t2.max_date
        INNER JOIN (
          SELECT product_id, date, MIN(price) as min_price
          FROM product_prices
          GROUP BY product_id, date
        ) t3 ON t1.product_id = t3.product_id AND t1.date = t3.date AND t1.price = t3.min_price
      ) pp ON p.id = pp.product_id
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `, [pageSize, offset]);
    return { rows, total };
  }
}

module.exports = Product;
