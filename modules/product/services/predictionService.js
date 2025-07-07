// 时间序列预测服务
const ProductPrice = require('../../price/models/price');

class PredictionService {
  // 简单移动平均预测
  static async simpleMovingAverage(productId, days = 7) {
    try {
      const rows = await ProductPrice.findPriceHistory(productId);
      console.log(`简单移动平均预测 - 商品${productId}，数据量: ${rows.length}`);
      
      if (rows.length < 3) {
        return { error: '数据不足，无法进行预测', trend: '稳定' };
      }
      
      // 如果数据量少于指定天数，使用所有可用数据
      const actualDays = Math.min(days, rows.length);

      // 获取最近的价格数据
      const recentPrices = rows.slice(-actualDays).map(row => parseFloat(row.price));
      const average = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
      
      // 计算趋势
      const trend = this.calculateTrend(recentPrices);
      
      return {
        method: '简单移动平均',
        predictedPrice: Math.round(average * 100) / 100,
        trend: trend,
        confidence: this.calculateConfidence(recentPrices),
        dataPoints: recentPrices.length
      };
    } catch (error) {
      console.error('简单移动平均预测失败:', error);
      return { error: '预测失败', trend: '稳定' };
    }
  }

  // 加权移动平均预测
  static async weightedMovingAverage(productId, days = 7) {
    try {
      const rows = await ProductPrice.findPriceHistory(productId);
      console.log(`加权移动平均预测 - 商品${productId}，数据量: ${rows.length}`);
      
      if (rows.length < 3) {
        return { error: '数据不足，无法进行预测', trend: '稳定' };
      }
      
      // 如果数据量少于指定天数，使用所有可用数据
      const actualDays = Math.min(days, rows.length);

      const recentPrices = rows.slice(-actualDays).map(row => parseFloat(row.price));
      
      // 计算权重（越近的数据权重越大）
      const weights = [];
      for (let i = 1; i <= actualDays; i++) {
        weights.push(i);
      }
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      
      // 计算加权平均
      let weightedSum = 0;
      for (let i = 0; i < recentPrices.length; i++) {
        weightedSum += recentPrices[i] * weights[i];
      }
      const weightedAverage = weightedSum / totalWeight;
      
      const trend = this.calculateTrend(recentPrices);
      
      return {
        method: '加权移动平均',
        predictedPrice: Math.round(weightedAverage * 100) / 100,
        trend: trend,
        confidence: this.calculateConfidence(recentPrices),
        dataPoints: recentPrices.length
      };
    } catch (error) {
      console.error('加权移动平均预测失败:', error);
      return { error: '预测失败', trend: '稳定' };
    }
  }

  // 线性回归预测
  static async linearRegression(productId, days = 30) {
    try {
      const rows = await ProductPrice.findPriceHistory(productId);
      console.log(`线性回归预测 - 商品${productId}，数据量: ${rows.length}`);
      
      if (rows.length < 3) {
        return { error: '数据不足，无法进行预测', trend: '稳定' };
      }

      // 获取最近的价格数据
      const recentData = rows.slice(-Math.min(days, rows.length));
      const xValues = recentData.map((_, index) => index);
      const yValues = recentData.map(row => parseFloat(row.price));

      // 计算线性回归参数
      const { slope, intercept, rSquared } = this.calculateLinearRegression(xValues, yValues);
      
      // 预测下一个时间点的价格
      const nextX = xValues.length;
      const predictedPrice = slope * nextX + intercept;
      
      // 计算趋势强度
      const trendStrength = Math.abs(slope);
      let trend = '稳定';
      if (slope > 0.5) trend = '强烈上涨';
      else if (slope > 0.1) trend = '温和上涨';
      else if (slope < -0.5) trend = '强烈下跌';
      else if (slope < -0.1) trend = '温和下跌';

      return {
        method: '线性回归',
        predictedPrice: Math.round(predictedPrice * 100) / 100,
        trend: trend,
        slope: Math.round(slope * 1000) / 1000,
        rSquared: Math.round(rSquared * 1000) / 1000,
        confidence: this.calculateRegressionConfidence(rSquared, recentData.length),
        dataPoints: recentData.length
      };
    } catch (error) {
      console.error('线性回归预测失败:', error);
      return { error: '预测失败', trend: '稳定' };
    }
  }

  // 指数平滑预测
  static async exponentialSmoothing(productId, alpha = 0.3) {
    try {
      const rows = await ProductPrice.findPriceHistory(productId);
      console.log(`指数平滑预测 - 商品${productId}，数据量: ${rows.length}`);
      
      if (rows.length < 2) {
        return { error: '数据不足，无法进行预测', trend: '稳定' };
      }

      const prices = rows.map(row => parseFloat(row.price));
      
      // 初始化平滑值
      let smoothed = prices[0];
      const smoothedValues = [smoothed];
      
      // 应用指数平滑
      for (let i = 1; i < prices.length; i++) {
        smoothed = alpha * prices[i] + (1 - alpha) * smoothed;
        smoothedValues.push(smoothed);
      }
      
      // 预测下一个值
      const predictedPrice = smoothed;
      const trend = this.calculateTrend(prices.slice(-7));
      
      return {
        method: '指数平滑',
        predictedPrice: Math.round(predictedPrice * 100) / 100,
        trend: trend,
        alpha: alpha,
        confidence: this.calculateConfidence(prices),
        dataPoints: prices.length
      };
    } catch (error) {
      console.error('指数平滑预测失败:', error);
      return { error: '预测失败', trend: '稳定' };
    }
  }

  // 季节性预测（基于月度数据）
  static async seasonalPrediction(productId) {
    try {
      const monthlyData = await ProductPrice.findMonthlyAverage(productId);
      console.log(`季节性预测 - 商品${productId}，月度数据量: ${monthlyData.length}`);
      
      if (monthlyData.length < 2) {
        return { error: '月度数据不足，无法进行季节性预测', trend: '稳定' };
      }

      // 计算季节性模式
      const seasonalPattern = this.calculateSeasonalPattern(monthlyData);
      
      // 预测下个月价格
      const lastMonth = monthlyData[monthlyData.length - 1];
      const predictedPrice = lastMonth.avgPrice * (1 + seasonalPattern.trend);
      
      return {
        method: '季节性预测',
        predictedPrice: Math.round(predictedPrice * 100) / 100,
        trend: seasonalPattern.trend > 0 ? '上涨' : '下跌',
        seasonalStrength: seasonalPattern.strength,
        confidence: seasonalPattern.confidence,
        dataPoints: monthlyData.length
      };
    } catch (error) {
      console.error('季节性预测失败:', error);
      return { error: '预测失败', trend: '稳定' };
    }
  }

  // 综合预测（多种算法结合）
  static async comprehensivePrediction(productId) {
    try {
      console.log(`开始综合预测 - 商品${productId}`);
      
      const [simpleMA, weightedMA, linearReg, expSmooth, seasonal] = await Promise.all([
        this.simpleMovingAverage(productId, 7),
        this.weightedMovingAverage(productId, 7),
        this.linearRegression(productId, 30),
        this.exponentialSmoothing(productId, 0.3),
        this.seasonalPrediction(productId)
      ]);

      console.log('各算法预测结果:', {
        simpleMA: simpleMA.error ? '失败' : '成功',
        weightedMA: weightedMA.error ? '失败' : '成功',
        linearReg: linearReg.error ? '失败' : '成功',
        expSmooth: expSmooth.error ? '失败' : '成功',
        seasonal: seasonal.error ? '失败' : '成功'
      });

      const predictions = [simpleMA, weightedMA, linearReg, expSmooth, seasonal]
        .filter(pred => !pred.error);

      console.log(`成功预测数量: ${predictions.length}/5`);

      if (predictions.length === 0) {
        // 尝试简单预测兜底
        const simple = await this.simplePrediction(productId);
        if (!simple.error) return simple;
        return { error: '所有预测方法都失败了', trend: '稳定' };
      }

      // 计算综合预测结果
      const validPrices = predictions
        .map(pred => pred.predictedPrice)
        .filter(price => price > 0);

      const averagePrice = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;
      
      // 计算预测一致性
      const variance = validPrices.reduce((sum, price) => sum + Math.pow(price - averagePrice, 2), 0) / validPrices.length;
      const consistency = Math.max(0, 1 - variance / (averagePrice * averagePrice));

      return {
        method: '综合预测',
        predictedPrice: Math.round(averagePrice * 100) / 100,
        predictions: predictions,
        consistency: Math.round(consistency * 1000) / 1000,
        confidence: this.calculateComprehensiveConfidence(predictions, consistency),
        dataPoints: predictions.length
      };
    } catch (error) {
      console.error('综合预测失败:', error);
      return { error: '预测失败', trend: '稳定' };
    }
  }

  // 辅助方法：计算趋势
  static calculateTrend(prices) {
    if (prices.length < 2) return '稳定';
    
    const firstHalf = prices.slice(0, Math.floor(prices.length / 2));
    const secondHalf = prices.slice(Math.floor(prices.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, price) => sum + price, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, price) => sum + price, 0) / secondHalf.length;
    
    const change = secondAvg - firstAvg;
    const changePercent = (change / firstAvg) * 100;
    
    if (changePercent > 5) return '上涨';
    if (changePercent < -5) return '下跌';
    return '稳定';
  }

  // 辅助方法：计算置信度
  static calculateConfidence(prices) {
    if (prices.length < 3) return '低';
    
    const variance = this.calculateVariance(prices);
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    
    if (coefficientOfVariation < 0.1) return '高';
    if (coefficientOfVariation < 0.2) return '中';
    return '低';
  }

  // 辅助方法：计算线性回归
  static calculateLinearRegression(xValues, yValues) {
    const n = xValues.length;
    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    const sumYY = yValues.reduce((sum, y) => sum + y * y, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // 计算R平方
    const yMean = sumY / n;
    const ssRes = yValues.reduce((sum, y, i) => {
      const yPred = slope * xValues[i] + intercept;
      return sum + Math.pow(y - yPred, 2);
    }, 0);
    const ssTot = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);

    return { slope, intercept, rSquared };
  }

  // 辅助方法：计算回归置信度
  static calculateRegressionConfidence(rSquared, dataPoints) {
    if (dataPoints < 10) return '低';
    if (rSquared > 0.7) return '高';
    if (rSquared > 0.4) return '中';
    return '低';
  }

  // 辅助方法：计算季节性模式
  static calculateSeasonalPattern(monthlyData) {
    if (monthlyData.length < 6) {
      return { trend: 0, strength: 0, confidence: '低' };
    }

    const prices = monthlyData.map(item => item.avgPrice);
    const { slope } = this.calculateLinearRegression(
      monthlyData.map((_, index) => index),
      prices
    );

    // 计算季节性强度
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const seasonalVariance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    const strength = Math.sqrt(seasonalVariance) / mean;

    return {
      trend: slope,
      strength: Math.round(strength * 1000) / 1000,
      confidence: strength > 0.1 ? '高' : strength > 0.05 ? '中' : '低'
    };
  }

  // 辅助方法：计算综合置信度
  static calculateComprehensiveConfidence(predictions, consistency) {
    const avgConfidence = predictions.reduce((sum, pred) => {
      const conf = pred.confidence === '高' ? 3 : pred.confidence === '中' ? 2 : 1;
      return sum + conf;
    }, 0) / predictions.length;

    const consistencyScore = consistency * 3;
    const totalScore = (avgConfidence + consistencyScore) / 2;

    if (totalScore > 2.5) return '高';
    if (totalScore > 1.5) return '中';
    return '低';
  }

  // 辅助方法：计算方差
  static calculateVariance(prices) {
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    return prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
  }

  // 简单预测（适用于数据量很少的情况）
  static async simplePrediction(productId) {
    try {
      const rows = await ProductPrice.findPriceHistory(productId);
      console.log(`简单预测 - 商品${productId}，数据量: ${rows.length}`);
      
      if (rows.length === 0) {
        return { error: '没有价格数据', trend: '稳定' };
      }

      const prices = rows.map(row => parseFloat(row.price));
      const currentPrice = prices[prices.length - 1];
      
      // 如果只有一条数据，直接返回当前价格
      if (prices.length === 1) {
        return {
          method: '当前价格',
          predictedPrice: currentPrice,
          trend: '稳定',
          confidence: '低',
          dataPoints: 1,
          note: '数据不足，仅显示当前价格'
        };
      }

      // 计算简单趋势
      const firstPrice = prices[0];
      const lastPrice = prices[prices.length - 1];
      const change = lastPrice - firstPrice;
      const changePercent = (change / firstPrice) * 100;
      
      let trend = '稳定';
      if (changePercent > 5) trend = '上涨';
      else if (changePercent < -5) trend = '下跌';

      return {
        method: '简单趋势预测',
        predictedPrice: currentPrice,
        trend: trend,
        confidence: '低',
        dataPoints: prices.length,
        changePercent: Math.round(changePercent * 100) / 100,
        note: '基于有限数据的简单预测'
      };
    } catch (error) {
      console.error('简单预测失败:', error);
      return { error: '预测失败', trend: '稳定' };
    }
  }
}

module.exports = PredictionService; 