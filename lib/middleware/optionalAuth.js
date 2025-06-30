const jwt = require('jsonwebtoken');
const { JWT } = require('../../config/constants');

module.exports = function optionalAuth(req, res, next) {
  // 兼容大小写
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      req.user = jwt.verify(token, JWT.SECRET_KEY);
    } catch (e) {
      req.user = null; // token无效时不报错，直接当未登录
    }
  } else {
    req.user = null;
  }
  console.log('[optionalAuth] authHeader:', authHeader, 'req.user:', req.user);
  next();
}; 