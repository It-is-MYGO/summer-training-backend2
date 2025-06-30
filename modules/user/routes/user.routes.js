const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// 获取所有用户
router.get('/', userController.getAllUsers);
// 更新用户
router.put('/:id', userController.updateUser);
// 删除用户
router.delete('/:id', userController.deleteUser);

module.exports = router; 