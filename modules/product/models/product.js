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
    const [rows] = await pool.query('SELECT * FROM products WHERE is_hot = 1 LIMIT 10');
    return rows;
  }

  static async findDropProducts() {
    const [rows] = await pool.query('SELECT * FROM products WHERE is_drop = 1 LIMIT 10');
    return rows;
  }

  static async findByKeyword(keyword) {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE title LIKE ? OR desc LIKE ?',
      [`%${keyword}%`, `%${keyword}%`]
    );
    return rows;
  }
}

module.exports = Product;
