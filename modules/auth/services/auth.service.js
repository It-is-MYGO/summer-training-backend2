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
    console.log('数据库查到的完整用户对象:', user);
    if (!user) {
      const error = new Error('用户不存在');
      error.code = 'USER_NOT_FOUND';
      error.isBusinessError = true;
      throw error;
    }
    // 增加封禁状态判断
    if (user.status === 'banned') {
      const error = new Error('该账号已被封禁，无法登录');
      error.code = 'USER_BANNED';
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
    const userResponse = { id: user.id, username: user.username, email: user.email, isadmin: user.isadmin, avatar: user.avatar };
    console.log('返回给前端的用户对象:', userResponse);
    return {
      user: userResponse,
      token: jwt.sign({ id: user.id, username: user.username }, JWT.SECRET_KEY, { expiresIn: JWT.EXPIRES_IN })
    };
  }

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      return null;
    }
    // 返回完整的用户信息，但不包含密码
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      isadmin: user.isadmin,
      avatar: user.avatar,
      status: user.status
    };
  }

  async updateProfile(userId, updateData) {
    // 直接存明文密码
    return await userRepository.updateById(userId, updateData);
  }
}

module.exports = new AuthService();