const authService = require('../services/auth.service');
const { DB_ERROR_CODES } = require('../../../config/constants');

class AuthController {
  async register(req, res) {
    try {
      const userId = await authService.register(req.body);
      res.status(201).json({ userId });
    } catch (error) {
      if (error.code === DB_ERROR_CODES.DUPLICATE_ENTRY) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      res.status(500).json({ message: 'Registration failed' });
    }
  }

  async login(req, res) {
    try {
      const result = await authService.login(req.body.username, req.body.password);
      res.json(result);
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }
}

module.exports = new AuthController();