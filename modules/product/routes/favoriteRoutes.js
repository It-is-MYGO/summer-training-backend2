const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');

// 获取用户收藏列表
router.get('/', favoriteController.getFavorites);

// 添加收藏
router.post('/', favoriteController.addFavorite);

// 移除收藏
router.delete('/:id', favoriteController.removeFavorite);

// 设置提醒价格 - 提供多个版本
router.put('/:id/alert-price', favoriteController.setAlertPriceNoAuth); // 标准版本
router.put('/:id/alert', favoriteController.setAlertPriceNoAuth); // 兼容前端版本

// 判断是否已收藏
router.get('/check', favoriteController.checkFavorite);

module.exports = router;