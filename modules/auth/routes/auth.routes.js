const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authValidator = require('../validators/auth.validator');
const authMiddleware = require('../../../lib/middleware/auth');

router.post('/register', 
  authValidator.register, 
  authController.register
);

router.post('/login', 
  authValidator.login,
  authController.login
);

router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;