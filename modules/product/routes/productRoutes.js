// 路由定义（Express）
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// 热门商品
router.get('/hot', productController.getHotProducts);

// 降价商品
router.get('/drops', productController.getDropProducts);

// 搜索商品
router.get('/search', productController.search);

// 商品详情
router.get('/:id', productController.getDetail);

// 价格历史
router.get('/:id/price-history', productController.getPriceHistory);

// 平台价格
router.get('/:id/platform-prices', productController.getPlatformPrices);

// 图表数据（支持基础版和增强版）
// 基础版：GET /api/products/:id/chart-data
// 增强版：GET /api/products/:id/chart-data?enhanced=true
router.get('/:id/chart-data', productController.getChartData);

// 价格预测
router.get('/:id/price-prediction', productController.getPricePrediction);

// 获取全部商品或分页商品
router.get('/', productController.getAllProducts);

module.exports = router;