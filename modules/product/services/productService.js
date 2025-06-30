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
      const monthlyData = await productRepository.findMonthlyAverage(id);
      
      if (monthlyData.length < 3) {
        return { prediction: '数据不足，无法预测' };
      }

      // 简单的线性回归预测
      const recentData = monthlyData.slice(-6); // 最近6个月
      const xValues = recentData.map((_, index) => index);
      const yValues = recentData.map(item => item.avgPrice);

      // 计算线性回归
      const n = xValues.length;
      const sumX = xValues.reduce((sum, x) => sum + x, 0);
      const sumY = yValues.reduce((sum, y) => sum + y, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
      const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // 预测下个月价格
      const nextMonth = n;
      const predictedPrice = slope * nextMonth + intercept;

      return {
        currentTrend: slope > 0 ? '上涨' : slope < 0 ? '下跌' : '稳定',
        predictedPrice: Math.round(predictedPrice),
        confidence: Math.abs(slope) > 50 ? '高' : Math.abs(slope) > 20 ? '中' : '低',
        slope: slope
      };
    } catch (error) {
      console.error('获取价格预测失败:', error);
      return { prediction: '预测失败' };
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
  }
};
