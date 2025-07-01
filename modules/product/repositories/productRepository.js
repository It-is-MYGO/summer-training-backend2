// 负责数据库操作（MySQL）
const Product = require('../models/product');
const ProductPrice = require('../../price/models/price');
const { pool } = require('../../../lib/database/connection');

module.exports = {
  async findByKeyword(keyword) {
    return await Product.findByKeyword(keyword);
  },

  async findHotProducts() {
    return await Product.findHotProducts();
  },

  async findDropProducts() {
    return await Product.findDropProducts();
  },

  async findById(id) {
    return await Product.findById(id);
  },

  async findPriceHistory(productId) {
    return await ProductPrice.findPriceHistory(productId);
  },

  async findPlatformPrices(productId) {
    return await ProductPrice.findPlatformPrices(productId);
  },

  async findChartData(productId) {
    return await ProductPrice.findChartData(productId);
  },

  async findMonthlyAverage(productId) {
    return await ProductPrice.findMonthlyAverage(productId);
  },

  async findPriceFluctuation(productId) {
    return await ProductPrice.findPriceFluctuation(productId);
  },

  async findRecentPriceTrend(productId, days = 7) {
    return await ProductPrice.findRecentPriceTrend(productId, days);
  },

  async findAllWithFavoriteCount() {
    return await Product.findAllWithFavoriteCount();
  },

  async findAllWithFavoriteCountPaged(page = 1, pageSize = 10) {
    return await Product.findAllWithFavoriteCountPaged(page, pageSize);
  },

  async updateStatus(id, status) {
    const [result] = await pool.query('UPDATE products SET status = ? WHERE id = ?', [status, id]);
    return result;
  },

  async deleteProduct(id) {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return result;
  },

  async createProduct(product) {
    const { title, desc, img } = product;
    const [result] = await pool.query(
      'INSERT INTO products (title, `desc`, img) VALUES (?, ?, ?)',
      [title, desc, img]
    );
    return { id: result.insertId };
  },

  async updateProduct(id, product) {
    const { title, desc, img, category, brand_id, is_hot, is_drop } = product;
    const [result] = await pool.query(
      'UPDATE products SET title=?, `desc`=?, img=?, category=?, brand_id=?, is_hot=?, is_drop=? WHERE id=?',
      [title, desc, img, category, brand_id, is_hot, is_drop, id]
    );
    return result;
  },

  async addProductPrice({ product_id, platform, price }) {
    const date = new Date().toISOString().slice(0, 10);
    const [result] = await pool.query(
      'INSERT INTO product_prices (product_id, platform, price, date) VALUES (?, ?, ?, ?)',
      [product_id, platform, price, date]
    );
    return result;
  },

  async getBrands() {
    const [rows] = await pool.query(`
      SELECT b.id, b.name, b.logo, COUNT(p.id) as product_count
      FROM brands b
      LEFT JOIN products p ON p.brand_id = b.id AND p.status = 1
      GROUP BY b.id, b.name, b.logo
      ORDER BY product_count DESC
    `);
    return rows;
  },

  async getProductsByBrand(brandId, page = 1, pageSize = 10) {
    const offset = (page - 1) * pageSize;
    
    // 获取总数
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM products WHERE brand_id = ? AND status = 1',
      [brandId]
    );
    const total = countResult[0].total;
    
    // 获取分页数据
    const [rows] = await pool.query(`
      SELECT p.*, 
             COALESCE(f.favorite_count, 0) as favorite_count,
             COALESCE(pp.price, 0) as current_price,
             COALESCE(pp.platform, '') as platform
      FROM products p
      LEFT JOIN (
        SELECT product_id, COUNT(*) as favorite_count 
        FROM favorites 
        GROUP BY product_id
      ) f ON p.id = f.product_id
      LEFT JOIN (
        SELECT product_id, price, platform
        FROM product_prices 
        WHERE date = (
          SELECT MAX(date) 
          FROM product_prices 
          WHERE product_id = product_prices.product_id
        )
      ) pp ON p.id = pp.product_id
      WHERE p.brand_id = ? AND p.status = 1
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `, [brandId, pageSize, offset]);
    
    return { rows, total };
  },

  async findBrandByName(name) {
    const [rows] = await pool.query('SELECT * FROM brands WHERE name = ?', [name]);
    return rows[0];
  },

  async createBrand(name) {
    const [result] = await pool.query('INSERT INTO brands (name) VALUES (?)', [name]);
    return result.insertId;
  },

  async setProductsStatusByBrand(brandId, status) {
    const [result] = await pool.query(
      'UPDATE products SET status = ? WHERE brand_id = ?',
      [status, brandId]
    );
    return result;
  }
};
