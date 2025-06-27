const jwt = require('jsonwebtoken');
const { JWT } = require('../../config/constants');

module.exports = (req, res, next) => {
  // 1. 从 Header 获取 token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 'INVALID_TOKEN', message: '未提供有效的认证令牌' });
  }

  // 2. 提取并验证 token
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ 
        code: 'TOKEN_EXPIRED',
        message: err.name === 'TokenExpiredError' ? '令牌已过期' : '无效令牌'
      });
    }

    // 3. 将解码后的用户信息挂载到请求对象
    req.user = {
      id: decoded.id,
      username: decoded.username
    };
    next();
  });
};