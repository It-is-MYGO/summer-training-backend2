// 处理商品相关的HTTP请求（Express）
const productService = require('../services/productService');

module.exports = {
  async getHotProducts(req, res) {
    try {
      const products = await productService.getHotProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: '获取热门商品失败', error: error.message });
    }
  },

  async getDropProducts(req, res) {
    try {
      const products = await productService.getDropProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: '获取降价商品失败', error: error.message });
    }
  },

  async search(req, res) {
    try {
      const { keyword } = req.query;
      if (!keyword) {
        return res.status(400).json({ message: '搜索关键词不能为空' });
      }
      const products = await productService.searchProducts(keyword);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: '搜索商品失败', error: error.message });
    }
  },

  async getDetail(req, res) {
    try {
      const { id } = req.params;
      const product = await productService.getProductDetail(id);
      res.json(product);
    } catch (error) {
      if (error.message === '商品不存在') {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: '获取商品详情失败', error: error.message });
    }
  },

  async getPriceHistory(req, res) {
    try {
      const { id } = req.params;
      const history = await productService.getPriceHistory(id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: '获取价格历史失败', error: error.message });
    }
  },

  async getPlatformPrices(req, res) {
    try {
      const { id } = req.params;
      const prices = await productService.getPlatformPrices(id);
      res.json(prices);
    } catch (error) {
      res.status(500).json({ message: '获取平台价格失败', error: error.message });
    }
  },

  async getChartData(req, res) {
    try {
      const { id } = req.params;
      const chartData = await productService.getChartData(id);
      res.json(chartData);
    } catch (error) {
      res.status(500).json({ message: '获取图表数据失败', error: error.message });
    }
  }
};
