const authService = require('../services/auth.service');
const logService = require('../../log/services/log.service');
const { DB_ERROR_CODES } = require('../../../config/constants');

class AuthController {
  async register(req, res, next) {
    try {
      const userId = await authService.register(req.body);
      // 添加用户注册日志
      await logService.addUserLog(
        userId,
        'register',
        'success',
        req.ip,
        req.headers['user-agent']
      );
      res.status(201).json({ userId });
    } catch (error) {
      if (error.code === DB_ERROR_CODES.DUPLICATE_ENTRY) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      console.error('注册异常:', error);
      next(error);
    }
  }

  async login(req, res) {
    try {
      const result = await authService.login(req.body.username, req.body.password);
      // 添加用户登录日志
      await logService.addUserLog(
        result.user.id,
        'login',
        'success',
        req.ip,
        req.headers['user-agent']
      );
      res.json(result);
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await authService.getProfile(req.user.id);
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: '获取用户信息失败' });
    }
  }

  async updateProfile(req, res) {
    try {
      const success = await authService.updateProfile(req.user.id, req.body);
      if (!success) {
        return res.status(400).json({ message: '更新失败' });
      }
      res.json({ message: '更新成功' });
    } catch (error) {
      res.status(500).json({ message: '更新用户信息失败' });
    }
  }

  async refreshToken(req, res) {
    try {
      const user = req.user; // 获取用户信息
      const userRepository = require('../../user/repositories/user.repository');// 获取用户信息
      const dbUser = await userRepository.findById(user.id);
      if (!dbUser || dbUser.status === 'banned') {
        return res.status(401).json({ message: '账号已被封禁，无法刷新token' });
      }
      const jwt = require('jsonwebtoken');// 生成token
      const { JWT } = require('../../../config/constants');// 获取token配置
      const newToken = jwt.sign({ id: user.id, username: user.username, isadmin: user.isadmin }, JWT.SECRET_KEY, { expiresIn: JWT.EXPIRES_IN });
      res.json({ token: newToken });//返回新token
    } catch (error) {
      res.status(401).json({ message: '刷新token失败' });
    }
  }
}

module.exports = new AuthController();