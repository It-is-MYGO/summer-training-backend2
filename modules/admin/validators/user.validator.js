const { body } = require('express-validator');

exports.updateUserValidator = [
  body('username').optional().isString().withMessage('用户名必须是字符串'),
  body('email').optional().isEmail().withMessage('请输入有效的邮箱地址'),
  body('role').optional().isIn(['user', 'admin']).withMessage('角色不合法'),
  body('status').optional().isIn(['active', 'disabled']).withMessage('状态不合法')
];