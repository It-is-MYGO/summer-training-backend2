const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');

// 获取用户收藏列表
router.get('/', favoriteController.getFavorites);

// 添加收藏
router.post('/', favoriteController.addFavorite);

// 移除收藏
router.delete('/:id', favoriteController.removeFavorite);

// 设置提醒价格
router.put('/:id/alert-price', favoriteController.setAlertPrice);

// 判断是否已收藏
router.get('/check', favoriteController.checkFavorite);

module.exports = router;
