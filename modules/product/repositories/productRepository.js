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
    const { title, desc, img, category, brand, is_hot, is_drop } = product;
    const [result] = await pool.query(
      'UPDATE products SET title=?, `desc`=?, img=?, category=?, brand=?, is_hot=?, is_drop=? WHERE id=?',
      [title, desc, img, category, brand, is_hot, is_drop, id]
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
  }
};
