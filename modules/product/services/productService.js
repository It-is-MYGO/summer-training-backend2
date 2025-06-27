// 处理商品相关的业务逻辑（MySQL）
const productRepository = require('../repositories/productRepository');

module.exports = {
  async searchProducts(keyword) {
    return await productRepository.findByKeyword(keyword);
  },

  async getHotProducts() {
    return await productRepository.findHotProducts();
  },

  async getDropProducts() {
    return await productRepository.findDropProducts();
  },

  async getProductDetail(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new Error('商品不存在');
    }
    return product;
  },

  async getPriceHistory(id) {
    const history = await productRepository.findPriceHistory(id);
    return history.map(item => ({
      date: item.date,
      price: parseFloat(item.price),
      platform: item.platform
    }));
  },

  async getPlatformPrices(id) {
    const prices = await productRepository.findPlatformPrices(id);
    return prices.map(item => ({
      platform: item.platform,
      price: parseFloat(item.price),
      date: item.date
    }));
  },

  async getChartData(id) {
    const chartData = await productRepository.findChartData(id);
    const monthlyData = await productRepository.findMonthlyAverage(id);
    
    return {
      platformData: chartData,
      monthlyData: monthlyData
    };
  }
};
