const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../../../lib/middleware/auth');

// 测试路由 - 不需要认证
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Admin模块路由正常工作',
    timestamp: new Date().toISOString()
  });
});

// 价格趋势数据获取
router.get('/price-trends', authMiddleware, adminController.getPriceTrends);

// AI价格分析
router.post('/ai-price-analysis', authMiddleware, adminController.analyzePriceData);

// 智谱AI市场趋势预测
router.post('/ai-market-prediction', authMiddleware, adminController.predictMarketTrend);

// 智谱AI智能推荐
router.post('/ai-smart-recommendations', authMiddleware, adminController.generateSmartRecommendations);

// 智谱AI配置检查
router.get('/ai-config-check', authMiddleware, adminController.checkAIConfig);

// 平台商品数量对比
router.get('/platform-comparison', authMiddleware, adminController.getPlatformComparison);

module.exports = router; 