const { body } = require('express-validator');

exports.createBrandValidator = [
  body('name').notEmpty().withMessage('品牌名不能为空'),
  body('logo').optional().isURL().withMessage('Logo必须是有效的URL')
];

exports.updateBrandValidator = [
  body('name').optional().notEmpty().withMessage('品牌名不能为空'),
  body('logo').optional().isURL().withMessage('Logo必须是有效的URL')
];