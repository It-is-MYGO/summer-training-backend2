const jwt = require('jsonwebtoken');
const { User } = require('../../modules/admin/models');


const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('未提供认证令牌');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) throw new Error('用户不存在');

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

// 确保使用 module.exports
module.exports = authenticate;