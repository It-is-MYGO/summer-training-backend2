// 路由定义
const Router = require('koa-router');
const productController = require('../controllers/productController');
const router = new Router({ prefix: '/api/products' });

router.get('/hot', productController.getHotProducts);
router.get('/drops', productController.getDropProducts);
router.get('/search', productController.search);
router.get('/:id', productController.getDetail);
router.get('/:id/price-history', productController.getPriceHistory);
router.get('/:id/platform-prices', productController.getPlatformPrices);

module.exports = router;
