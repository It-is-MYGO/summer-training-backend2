const userRepository = require('../../user/repositories/user.repository');
const { JWT } = require('../../../config/constants');
const jwt = require('jsonwebtoken');
const { pool } = require('../../../lib/database/connection');

class AuthService {
  async register(userData) {
    // 检查邮箱是否已存在  邮箱唯一性检查
    const existEmailUser = await userRepository.findByEmail(userData.email);
    if (existEmailUser) {
      const error = new Error('邮箱已被注册');
      error.code = 'EMAIL_EXISTS';
      error.isBusinessError = true;
      throw error;
    }
    // 直接存储明文密码，isadmin 默认为 0 创建用户
    const userId = await userRepository.createUser(userData.username, userData.password, userData.email, 0);
    return userId;
  }

  async login(username, password) {
    // 查询用户是否存在
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
    // 返回用户信息
    const userResponse = { id: user.id, username: user.username, email: user.email, isadmin: user.isadmin, avatar: user.avatar };
    console.log('返回给前端的用户对象:', userResponse);
    // 返回用户信息和token
    return {
      user: userResponse,
      token: jwt.sign({ id: user.id, username: user.username, isadmin: user.isadmin }, JWT.SECRET_KEY, { expiresIn: JWT.EXPIRES_IN })
    };
  }

  async getProfile(userId) {
    return await userRepository.findById(userId);
  }

  async updateProfile(userId, updateData) {
    // 直接存明文密码
    return await userRepository.updateById(userId, updateData);
  }
}

module.exports = new AuthService();