// 处理商品相关的业务逻辑（MySQL）
const productRepository = require('../repositories/productRepository');
const predictionService = require('./predictionService');

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
    // 查询最新平台价格，覆盖 current_price 字段
    const prices = await productRepository.findPlatformPrices(id);
    if (prices && prices.length > 0) {
      // 取最低价（如有多平台可自行调整）
      product.current_price = prices[0].price;
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

  // 统一的图表数据获取方法，支持基础版和增强版
  async getChartData(id, enhanced = false) {
    try {
      if (!enhanced) {
        // 基础版：只返回平台数据和月度数据
        const [chartData, monthlyData] = await Promise.all([
          productRepository.findChartData(id),
          productRepository.findMonthlyAverage(id)
        ]);
        
        return {
          platformData: chartData,
          monthlyData: monthlyData
        };
      } else {
        // 增强版：返回所有数据
        const [chartData, monthlyData, fluctuationData, trendData] = await Promise.all([
          productRepository.findChartData(id),
          productRepository.findMonthlyAverage(id),
          productRepository.findPriceFluctuation(id),
          productRepository.findRecentPriceTrend(id)
        ]);

        // 计算价格波动统计
        const priceStats = {
          totalFluctuation: 0,
          averageFluctuation: 0,
          mostVolatilePlatform: null,
          leastVolatilePlatform: null
        };

        if (fluctuationData.length > 0) {
          const totalFluctuation = fluctuationData.reduce((sum, item) => sum + item.fluctuation, 0);
          priceStats.totalFluctuation = totalFluctuation;
          priceStats.averageFluctuation = totalFluctuation / fluctuationData.length;
          
          const sortedByFluctuation = [...fluctuationData].sort((a, b) => b.fluctuation - a.fluctuation);
          priceStats.mostVolatilePlatform = sortedByFluctuation[0];
          priceStats.leastVolatilePlatform = sortedByFluctuation[sortedByFluctuation.length - 1];
        }

        return {
          platformData: chartData,
          monthlyData: monthlyData,
          fluctuationData: fluctuationData,
          trendData: trendData,
          priceStats: priceStats
        };
      }
    } catch (error) {
      console.error('获取图表数据失败:', error);
      throw new Error('获取图表数据失败');
    }
  },

  // 获取价格预测数据
  async getPricePrediction(id) {
    try {
      // 调用 predictionService 的综合预测方法
      const prediction = await predictionService.comprehensivePrediction(id);
      return prediction;
    } catch (error) {
      console.error('获取价格预测失败:', error);
      return { error: '预测失败' };
    }
  },

  async getAllProducts() {
    return await productRepository.findAllWithFavoriteCount();
  },

  async getAllProductsPaged(page = 1, pageSize = 10) {
    return await productRepository.findAllWithFavoriteCountPaged(page, pageSize);
  },

  async updateStatus(id, status) {
    return await productRepository.updateStatus(id, status);
  },

  async deleteProduct(id) {
    return await productRepository.deleteProduct(id);
  },

  async createProduct(product) {
    return await productRepository.createProduct(product);
  },

  async updateProduct(id, product) {
    return await productRepository.updateProduct(id, product);
  },

  async addProductPrice(data) {
    return await productRepository.addProductPrice(data);
  },

  async getBrands() {
    return await productRepository.getBrands();
  },

  async getProductsByBrand(brandId, page = 1, pageSize = 10) {
    return await productRepository.getProductsByBrand(brandId, page, pageSize);
  },

  async findOrCreateBrandByName(name) {
    let brand = await productRepository.findBrandByName(name);
    if (!brand) {
      const id = await productRepository.createBrand(name);
      brand = { id, name };
    }
    return [brand];
  },

  // 获取商品分类分布数据
  async getCategoryDistribution() {
    try {
      const distribution = await productRepository.getCategoryDistribution();
      
      // 分类编号到中文名称映射
      const categoryMap = {
        0: '手机数码',
        1: '服装鞋帽',
        2: '运动户外',
        3: '家居生活',
        4: '食品饮料',
        5: '母婴用品',
        6: '美妆护肤',
        7: '图书音像',
        8: '汽车用品',
        9: '医药保健',
        10: '未分类',
        '手机数码': '手机数码',
        '服装鞋帽': '服装鞋帽',
        '运动户外': '运动户外',
        '家居生活': '家居生活',
        '食品饮料': '食品饮料',
        '母婴用品': '母婴用品',
        '美妆护肤': '美妆护肤',
        '图书音像': '图书音像',
        '汽车用品': '汽车用品',
        '医药保健': '医药保健',
        '未分类': '未分类'
      };

      // 保证所有分类都在，没数据的补0
      const allCategories = [
        '手机数码', '服装鞋帽', '运动户外', '家居生活', '食品饮料',
        '母婴用品', '美妆护肤', '图书音像', '汽车用品', '医药保健', '未分类'
      ];

      // 先转成对象方便查找
      const categoryMapResult = {};
      distribution.forEach(item => {
        // 映射为中文名称
        const name = categoryMap[item.category] || '未分类';
        categoryMapResult[name] = item.count;
      });

      // 返回数组
      return allCategories.map(category => ({
        category,
        count: categoryMapResult[category] || 0
      }));
    } catch (error) {
      console.error('获取分类分布失败:', error);
      throw new Error('获取分类分布失败');
    }
  }
};
