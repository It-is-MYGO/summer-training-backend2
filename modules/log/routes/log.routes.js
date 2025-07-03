const express = require('express');
const router = express.Router();
const logController = require('../controllers/log.controller');

// 获取用户日志
router.get('/user-logs', logController.getUserLogs);
// 新增用户日志
router.post('/user-logs', logController.addUserLog);

// 兼容原有日志上报
router.post('/', logController.logToTerminal);

module.exports = router; 