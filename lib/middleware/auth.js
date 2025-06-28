const jwt = require('jsonwebtoken');
const { JWT } = require('../../config/constants');

module.exports = (req, res, next) => {
  console.log('=== 认证中间件开始 ===');
  
  // 1. 从 Header 获取 token
  const authHeader = req.headers.authorization;
  console.log('Authorization Header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Token格式错误或缺失');
    return res.status(401).json({ code: 'INVALID_TOKEN', message: '未提供有效的认证令牌' });
  }

  // 2. 提取并验证 token
  const token = authHeader.split(' ')[1];
  console.log('提取的Token:', token);
  console.log('JWT密钥:', JWT.SECRET_KEY);
  
  jwt.verify(token, JWT.SECRET_KEY, (err, decoded) => {
    if (err) {
      console.log('Token验证失败:', err.message);
      console.log('错误类型:', err.name);
      return res.status(401).json({ 
        code: 'TOKEN_EXPIRED',
        message: err.name === 'TokenExpiredError' ? '令牌已过期' : '无效令牌'
      });
    }

    console.log('Token验证成功，解码信息:', decoded);
    
    // 3. 将解码后的用户信息挂载到请求对象
    req.user = {
      id: decoded.id,
      username: decoded.username
    };
    console.log('用户信息已挂载:', req.user);
    console.log('=== 认证中间件结束 ===');
    next();
  });
};