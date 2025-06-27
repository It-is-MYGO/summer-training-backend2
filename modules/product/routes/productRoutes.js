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

// 图表数据（新增）
router.get('/:id/chart-data', productController.getChartData);

module.exports = router;
