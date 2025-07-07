// 路由定义（Express）
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// 具体路径路由必须放在 /:id 之前
router.get('/all', productController.getAllProducts);
router.get('/hot', productController.getHotProducts);
router.get('/drops', productController.getDropProducts);
router.get('/brands', productController.getBrands);
router.get('/brands/:brandId', productController.getProductsByBrand);
router.get('/search', productController.search);
router.get('/category-distribution', productController.getCategoryDistribution);
router.get('/:id/price-history', productController.getPriceHistory);
router.get('/:id/platform-prices', productController.getPlatformPrices);
router.get('/:id/chart-data', productController.getChartData);
router.get('/:id/price-prediction', productController.getPricePrediction);

// 商品详情路由最后注册，避免捕获其他路径
router.get('/:id', productController.getDetail);

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

// 支持分页的商品列表
router.get('/', productController.getAllProducts);

// 价格预测接口
router.get('/predict/:id', productController.getPricePrediction);

module.exports = router;