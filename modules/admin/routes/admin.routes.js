const path = require('path');
const express = require('express');
const router = express.Router();

// 正确路径引用
const authMiddleware = require('../../../lib/middleware/auth.middleware');
const adminMiddleware = require('../../../lib/middleware/admin.middleware');


// 路由定义
const userController = require('../controllers/user.controller');
const postController = require('../controllers/post.controller');
const productController = require('../controllers/product.controller');
const brandController = require('../controllers/brand.controller');
const chartController = require('../controllers/chart.controller');

// 用户管理路由
router.get('/users', authMiddleware, adminMiddleware, userController.getAllUsers);
router.put('/users/:id', authMiddleware, adminMiddleware, userController.updateUser);
router.delete('/users/:id', authMiddleware, adminMiddleware, userController.deleteUser);

// 动态管理路由
router.get('/posts', authMiddleware, adminMiddleware, postController.getAllPosts);
router.get('/posts/:id', authMiddleware, adminMiddleware, postController.getPostById);
router.delete('/posts/:id', authMiddleware, adminMiddleware, postController.deletePost);
router.delete('/posts/:postId/comments/:commentId', authMiddleware, adminMiddleware, postController.deleteComment);

// 商品管理路由
router.get('/products', authMiddleware, adminMiddleware, productController.getAllProducts);
router.put('/products/:id/toggle-status', authMiddleware, adminMiddleware, productController.toggleProductStatus);

// 品牌管理路由
router.get('/brands', authMiddleware, adminMiddleware, brandController.getAllBrands);
router.post('/brands', authMiddleware, adminMiddleware, brandController.createBrand);
router.put('/brands/:id', authMiddleware, adminMiddleware, brandController.updateBrand);
router.delete('/brands/:id', authMiddleware, adminMiddleware, brandController.deleteBrand);

// 图表分析路由
router.get('/charts/user-activity', authMiddleware, adminMiddleware, chartController.getUserActivityStats);
router.get('/charts/product-category', authMiddleware, adminMiddleware, chartController.getProductCategoryStats);
router.get('/charts/price-trend', authMiddleware, adminMiddleware, chartController.getPriceTrendStats);
router.get('/charts/platform-comparison', authMiddleware, adminMiddleware, chartController.getPlatformComparisonStats);

module.exports = router;