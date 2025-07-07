const adminRepository = require('../repositories/admin.repository');
const zhipuaiService = require('./zhipuai.service');

// 获取价格趋势数据
async function getPriceTrends(days, category) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const priceData = await adminRepository.getPriceTrends(startDate, endDate, category);
    
    // 按日期分组数据
    const groupedData = {};
    priceData.forEach(item => {
      const date = item.date.toISOString().split('T')[0];
      if (!groupedData[date]) {
        groupedData[date] = {
          date: date,
          prices: []
        };
      }
      
      groupedData[date].prices.push({
        productId: item.product_id,
        productTitle: item.title,
        category: item.category,
        price: parseFloat(item.price),
        platform: item.platform,
        url: item.url
      });
    });
    
    // 转换为数组并按日期排序
    const result = Object.values(groupedData).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return result;
  } catch (error) {
    console.error('获取价格趋势数据失败:', error);
    throw error;
  }
}

// AI价格分析
async function analyzePriceData(priceData, category, timeRange) {
  try {
    const insights = [];
    
    if (!priceData || priceData.length === 0) {
      return insights;
    }
    
    // 优先使用智谱AI进行分析
    try {
      console.log('🤖 尝试使用智谱AI进行智能分析...');
      const aiInsights = await zhipuaiService.analyzePriceIntelligence(priceData, category, timeRange);
      
      if (aiInsights && aiInsights.length > 0) {
        console.log('✅ 智谱AI分析成功，返回AI洞察');
        return aiInsights;
      }
    } catch (aiError) {
      console.warn('⚠️ 智谱AI分析失败，回退到本地分析:', aiError.message);
    }
    
    // 如果AI分析失败，使用本地分析作为备选
    console.log('📊 使用本地分析作为备选方案...');
    
    // 1. 价格变化率分析
    const changeRateInsights = analyzePriceChangeRate(priceData);
    insights.push(...changeRateInsights);
    
    // 2. 价格波动分析
    const volatilityInsights = analyzePriceVolatility(priceData);
    insights.push(...volatilityInsights);
    
    // 3. 异常价格检测
    const anomalyInsights = detectPriceAnomalies(priceData);
    insights.push(...anomalyInsights);
    
    // 4. 趋势预测分析
    const trendInsights = analyzePriceTrends(priceData);
    insights.push(...trendInsights);
    
    // 5. 平台价格对比
    const platformInsights = comparePlatformPrices(priceData);
    insights.push(...platformInsights);
    
    return insights;
  } catch (error) {
    console.error('AI价格分析失败:', error);
    throw error;
  }
}

// 分析价格变化率
function analyzePriceChangeRate(priceData) {
  const insights = [];
  
  if (priceData.length < 2) return insights;
  
  const latestDay = priceData[priceData.length - 1];
  const previousDay = priceData[priceData.length - 2];
  
  if (!latestDay.prices || !previousDay.prices) return insights;
  
  // 计算平均价格变化
  const latestAvg = latestDay.prices.reduce((sum, p) => sum + p.price, 0) / latestDay.prices.length;
  const previousAvg = previousDay.prices.reduce((sum, p) => sum + p.price, 0) / previousDay.prices.length;
  
  if (previousAvg > 0) {
    const changeRate = ((latestAvg - previousAvg) / previousAvg) * 100;
    
    if (changeRate > 15) {
      insights.push({
        id: Date.now() + Math.random(),
        type: 'warning',
        icon: '🚨',
        message: `价格异常上涨 ${changeRate.toFixed(1)}%，建议立即关注市场动态`
      });
    } else if (changeRate > 8) {
      insights.push({
        id: Date.now() + Math.random(),
        type: 'warning',
        icon: '⚠️',
        message: `价格明显上涨 ${changeRate.toFixed(1)}%，需要密切关注`
      });
    } else if (changeRate < -15) {
      insights.push({
        id: Date.now() + Math.random(),
        type: 'success',
        icon: '💰',
        message: `价格大幅下降 ${Math.abs(changeRate).toFixed(1)}%，可能是最佳购买时机`
      });
    } else if (changeRate < -8) {
      insights.push({
        id: Date.now() + Math.random(),
        type: 'info',
        icon: '📉',
        message: `价格下降 ${Math.abs(changeRate).toFixed(1)}%，建议关注促销活动`
      });
    }
  }
  
  return insights;
}

// 分析价格波动
function analyzePriceVolatility(priceData) {
  const insights = [];
  
  const allPrices = priceData.flatMap(day => day.prices || []);
  if (allPrices.length === 0) return insights;
  
  const prices = allPrices.map(p => p.price);
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const coefficient = (stdDev / mean) * 100;
  
  if (coefficient > 30) {
    insights.push({
      id: Date.now() + Math.random(),
      type: 'warning',
      icon: '📊',
      message: `价格波动极大 (${coefficient.toFixed(1)}%)，市场极不稳定，建议谨慎决策`
    });
  } else if (coefficient > 20) {
    insights.push({
      id: Date.now() + Math.random(),
      type: 'warning',
      icon: '📈',
      message: `价格波动较大 (${coefficient.toFixed(1)}%)，市场不稳定，需要密切关注`
    });
  } else if (coefficient < 5) {
    insights.push({
      id: Date.now() + Math.random(),
      type: 'success',
      icon: '📊',
      message: `价格稳定 (波动率${coefficient.toFixed(1)}%)，市场相对平稳`
    });
  }
  
  return insights;
}

// 检测价格异常
function detectPriceAnomalies(priceData) {
  const insights = [];
  
  const allPrices = priceData.flatMap(day => day.prices || []);
  if (allPrices.length === 0) return insights;
  
  const prices = allPrices.map(p => p.price);
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const stdDev = Math.sqrt(prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length);
  
  // 检测异常值（超过2个标准差）
  const anomalies = allPrices.filter(p => Math.abs(p.price - mean) > 2 * stdDev);
  
  if (anomalies.length > 0) {
    const anomalyCount = anomalies.length;
    const totalCount = allPrices.length;
    const anomalyRate = (anomalyCount / totalCount) * 100;
    
    if (anomalyRate > 10) {
      insights.push({
        id: Date.now() + Math.random(),
        type: 'warning',
        icon: '🔍',
        message: `检测到 ${anomalyCount} 个异常价格 (${anomalyRate.toFixed(1)}%)，可能存在数据错误或特殊促销`
      });
    }
  }
  
  return insights;
}

// 分析价格趋势
function analyzePriceTrends(priceData) {
  const insights = [];
  
  if (priceData.length < 3) return insights;
  
  // 计算趋势斜率
  const dates = priceData.map((day, index) => index);
  const avgPrices = priceData.map(day => {
    const prices = day.prices || [];
    return prices.length > 0 ? prices.reduce((sum, p) => sum + p.price, 0) / prices.length : 0;
  });
  
  // 简单线性回归计算趋势
  const n = dates.length;
  const sumX = dates.reduce((sum, x) => sum + x, 0);
  const sumY = avgPrices.reduce((sum, y) => sum + y, 0);
  const sumXY = dates.reduce((sum, x, i) => sum + x * avgPrices[i], 0);
  const sumXX = dates.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  if (slope > 50) {
    insights.push({
      id: Date.now() + Math.random(),
      type: 'warning',
      icon: '📈',
      message: `价格呈强烈上升趋势，预计短期内价格将继续上涨`
    });
  } else if (slope > 20) {
    insights.push({
      id: Date.now() + Math.random(),
      type: 'info',
      icon: '📈',
      message: `价格呈上升趋势，建议关注价格变化`
    });
  } else if (slope < -50) {
    insights.push({
      id: Date.now() + Math.random(),
      type: 'success',
      icon: '📉',
      message: `价格呈强烈下降趋势，可能是购买的好时机`
    });
  } else if (slope < -20) {
    insights.push({
      id: Date.now() + Math.random(),
      type: 'info',
      icon: '📉',
      message: `价格呈下降趋势，可以等待更好的价格`
    });
  }
  
  return insights;
}

// 平台价格对比
function comparePlatformPrices(priceData) {
  const insights = [];
  
  const allPrices = priceData.flatMap(day => day.prices || []);
  if (allPrices.length === 0) return insights;
  
  // 按平台分组计算平均价格
  const platformPrices = {};
  allPrices.forEach(price => {
    if (!platformPrices[price.platform]) {
      platformPrices[price.platform] = [];
    }
    platformPrices[price.platform].push(price.price);
  });
  
  const platformAvgs = {};
  Object.keys(platformPrices).forEach(platform => {
    const prices = platformPrices[platform];
    platformAvgs[platform] = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  });
  
  // 找出最高和最低价格的平台
  const platforms = Object.keys(platformAvgs);
  if (platforms.length > 1) {
    const sortedPlatforms = platforms.sort((a, b) => platformAvgs[a] - platformAvgs[b]);
    const lowestPlatform = sortedPlatforms[0];
    const highestPlatform = sortedPlatforms[sortedPlatforms.length - 1];
    const priceDiff = platformAvgs[highestPlatform] - platformAvgs[lowestPlatform];
    const priceDiffRate = (priceDiff / platformAvgs[lowestPlatform]) * 100;
    
    if (priceDiffRate > 20) {
      insights.push({
        id: Date.now() + Math.random(),
        type: 'info',
        icon: '🛒',
        message: `${lowestPlatform} 平台价格最低，比 ${highestPlatform} 便宜 ${priceDiffRate.toFixed(1)}%，建议优先考虑`
      });
    }
  }
  
  return insights;
}

module.exports = {
  getPriceTrends,
  analyzePriceData
}; 