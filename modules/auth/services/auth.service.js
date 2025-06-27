const userRepository = require('../../user/repositories/user.repository');
const { JWT } = require('../../../config/constants');
const jwt = require('jsonwebtoken');
const { pool } = require('../../../lib/database/connection');

class AuthService {
  async register(userData) {
    // 直接存储明文密码，isadmin 默认为 0
    const userId = await userRepository.createUser(userData.username, userData.password, userData.email, 0);
    return userId;
  }

  async login(username, password) {
    const user = await userRepository.findByUsername(username);
    console.log('数据库查到的密码:', user && user.password, '前端传来的密码:', password);
    if (!user) {
      const error = new Error('用户不存在');
      error.code = 'USER_NOT_FOUND';
      error.isBusinessError = true;
      throw error;
    }
    // 明文密码直接比较
    if (user.password !== password) {
      const error = new Error('密码错误');
      error.code = 'INVALID_PASSWORD';
      error.isBusinessError = true;
      throw error;
    }
    return {
      user: { id: user.id, username: user.username, isadmin: user.isadmin },
      token: jwt.sign({ id: user.id }, JWT.SECRET_KEY, { expiresIn: JWT.EXPIRES_IN })
    };
  }

  async getProfile(userId) {
    return await userRepository.findById(userId);
  }

  async updateProfile(userId, updateData) {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    return await userRepository.updateById(userId, updateData);
  }
}

module.exports = new AuthService();