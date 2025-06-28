const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../../../lib/middleware/auth');

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../../uploads/avatars');
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名：时间戳 + 随机数 + 原扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 只允许图片文件
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  }
});

// 头像上传接口
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的头像文件' });
    }

    // 生成文件访问URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    // 更新用户头像信息到数据库
    const userRepository = require('../../user/repositories/user.repository');
    const success = await userRepository.updateAvatar(req.user.id, avatarUrl);
    
    if (success) {
      res.json({ 
        message: '头像上传成功',
        avatarUrl: avatarUrl
      });
    } else {
      res.status(500).json({ message: '头像信息更新失败' });
    }
  } catch (error) {
    console.error('头像上传失败:', error);
    res.status(500).json({ message: '头像上传失败: ' + error.message });
  }
});

// 获取头像接口
router.get('/avatar/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../../uploads/avatars', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: '头像文件不存在' });
  }
});

module.exports = router; 