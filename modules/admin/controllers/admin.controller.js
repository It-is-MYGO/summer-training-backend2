const adminService = require('../services/admin.service');

// 获取价格趋势数据
async function getPriceTrends(req, res) {
  try {
    console.log('🔍 开始获取价格趋势数据...');
    console.log('查询参数:', req.query);
    
    const { days = 7, category } = req.query;
    
    console.log('调用adminService.getPriceTrends...');
    const priceData = await adminService.getPriceTrends(parseInt(days), category);
    
    console.log('✅ 价格趋势数据获取成功，数据条数:', priceData.length);
    
    res.json({
      success: true,
      data: priceData
    });
  } catch (error) {
    console.error('❌ 获取价格趋势数据失败:', error);
    console.error('错误堆栈:', error.stack);
    
    res.status(500).json({
      success: false,
      message: '获取价格趋势数据失败',
      error: error.message
    });
  }
}

// AI价格分析
async function analyzePriceData(req, res) {
  try {
    console.log('🤖 开始AI价格分析...');
    console.log('请求体:', req.body);
    
    const { priceData, category, timeRange } = req.body;
    
    console.log('调用adminService.analyzePriceData...');
    const insights = await adminService.analyzePriceData(priceData, category, timeRange);
    
    console.log('✅ AI价格分析成功，洞察数量:', insights.length);
    
    res.json({
      success: true,
      insights: insights
    });
  } catch (error) {
    console.error('❌ AI价格分析失败:', error);
    console.error('错误堆栈:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'AI价格分析失败',
      error: error.message
    });
  }
}

// 智谱AI市场趋势预测
async function predictMarketTrend(req, res) {
  try {
    console.log('🔮 开始智谱AI市场趋势预测...');
    
    const { priceData, category } = req.body;
    
    const zhipuaiService = require('../services/zhipuai.service');
    const prediction = await zhipuaiService.predictMarketTrend(priceData, category);
    
    console.log('✅ 市场趋势预测完成');
    
    res.json({
      success: true,
      prediction: prediction
    });
  } catch (error) {
    console.error('❌ 市场趋势预测失败:', error);
    
    res.status(500).json({
      success: false,
      message: '市场趋势预测失败',
      error: error.message
    });
  }
}

// 智谱AI智能推荐
async function generateSmartRecommendations(req, res) {
  try {
    console.log('🎯 开始智谱AI智能推荐...');
    
    const { priceData, userPreferences } = req.body;
    
    const zhipuaiService = require('../services/zhipuai.service');
    const recommendations = await zhipuaiService.generateSmartRecommendations(priceData, userPreferences);
    
    console.log('✅ 智能推荐生成完成');
    
    res.json({
      success: true,
      recommendations: recommendations
    });
  } catch (error) {
    console.error('❌ 智能推荐生成失败:', error);
    
    res.status(500).json({
      success: false,
      message: '智能推荐生成失败',
      error: error.message
    });
  }
}

// 智谱AI配置检查
async function checkAIConfig(req, res) {
  try {
    console.log('🔧 检查智谱AI配置...');
    
    const { zhipuaiConfig } = require('../../../config/zhipuai');
    
    const configStatus = {
      apiKeyConfigured: !!zhipuaiConfig.apiKey && zhipuaiConfig.apiKey !== 'your_zhipuai_api_key_here',
      models: zhipuaiConfig.models,
      defaultParams: zhipuaiConfig.defaultParams
    };
    
    console.log('✅ AI配置检查完成');
    
    res.json({
      success: true,
      config: configStatus
    });
  } catch (error) {
    console.error('❌ AI配置检查失败:', error);
    
    res.status(500).json({
      success: false,
      message: 'AI配置检查失败',
      error: error.message
    });
  }
}

module.exports = {
  getPriceTrends,
  analyzePriceData,
  predictMarketTrend,
  generateSmartRecommendations,
  checkAIConfig
}; 