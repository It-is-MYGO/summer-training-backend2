// 路由定义（Express）
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// 热门商品
router.get('/hot', productController.getHotProducts);

// 降价商品
router.get('/drops', productController.getDropProducts);

// 品牌相关API
router.get('/brands', productController.getBrands);
router.get('/brands/:brandName', productController.getProductsByBrand);

// 搜索商品
router.get('/search', productController.search);

// 商品详情
router.get('/:id', productController.getDetail);

// 价格历史
router.get('/:id/price-history', productController.getPriceHistory);

// 平台价格
router.get('/:id/platform-prices', productController.getPlatformPrices);

// 图表数据（支持基础版和增强版）
router.get('/:id/chart-data', productController.getChartData);

// 价格预测
router.get('/:id/price-prediction', productController.getPricePrediction);

// 获取全部商品或分页商品
router.get('/', productController.getAllProducts);

// 修改商品状态（上架/下架）
router.patch('/:id/status', productController.updateStatus);

// 删除商品
router.delete('/:id', productController.deleteProduct);

// 添加商品
router.post('/', productController.createProduct);

// 编辑商品
router.put('/:id', productController.updateProduct);

// 添加商品价格
router.post('/product-prices', productController.addProductPrice);

module.exports = router;