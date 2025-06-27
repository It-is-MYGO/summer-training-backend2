// 负责数据库操作（MySQL）
const Product = require('../models/product');
const ProductPrice = require('../../price/models/price');

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
  }
};
