const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// 获取所有用户
router.get('/', userController.getAllUsers);
// 更新用户
router.put('/:id', userController.updateUser);
// 删除用户
router.delete('/:id', userController.deleteUser);
// 获取用户活跃度分布
router.get('/activity-distribution', userController.getActivityDistribution);
// 获取用户分页
router.get('/paged', userController.getUsersPaged);

module.exports = router; 