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
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ? AND status = 1', [id]);
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
    // 查询分页数据，只查商品和收藏数，不 join 价格表
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
      LIMIT ? OFFSET ?
    `, [pageSize, offset]);
    return { rows, total };
  }
}

module.exports = Product;
