const userRepository = require('../../user/repositories/user.repository');
const { JWT } = require('../../../config/constants');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class AuthService {
  async register(userData) {
    // 密码加密
    userData.password = await bcrypt.hash(userData.password, 10);
    return await userRepository.create(userData);
  }

  async login(username, password) {
  const user = await userRepository.findByUsername(username);
  if (!user) {
    const error = new Error('用户不存在');
    error.code = 'USER_NOT_FOUND';
    error.isBusinessError = true;
    throw error;
  }
    
    return {
      user: { id: user.id, username: user.username },
      token: jwt.sign({ id: user.id }, JWT.SECRET_KEY, { expiresIn: JWT.EXPIRES_IN })
    };
  }
}

module.exports = new AuthService();