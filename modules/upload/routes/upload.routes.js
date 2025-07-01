const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../../../lib/middleware/auth');

// 配置multer存储 - 头像
const avatarStorage = multer.diskStorage({
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

// 配置multer存储 - 动态图片
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../../uploads/images');
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名：时间戳 + 随机数 + 原扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
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

const avatarUpload = multer({ 
  storage: avatarStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  }
});

const imageUpload = multer({ 
  storage: imageStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  }
});

// 头像上传接口
router.post('/avatar', authMiddleware, (req, res, next) => {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err) {
      console.error('Multer错误:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: '文件大小超过限制（最大5MB）' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ message: '文件字段名不正确' });
      }
      return res.status(400).json({ message: '文件上传错误: ' + err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('开始处理头像上传请求');
    console.log('用户ID:', req.user.id);
    console.log('文件信息:', req.file);
    
    if (!req.file) {
      console.log('没有接收到文件');
      return res.status(400).json({ message: '请选择要上传的头像文件' });
    }

    console.log('文件上传成功:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // 生成文件访问URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    // 更新用户头像信息到数据库
    const userRepository = require('../../user/repositories/user.repository');
    const success = await userRepository.updateAvatar(req.user.id, avatarUrl);
    
    if (success) {
      console.log('头像信息更新成功');
      res.json({ 
        message: '头像上传成功',
        avatarUrl: avatarUrl
      });
    } else {
      console.log('头像信息更新失败');
      res.status(500).json({ message: '头像信息更新失败' });
    }
  } catch (error) {
    console.error('头像上传处理失败:', error);
    res.status(500).json({ message: '头像上传失败: ' + error.message });
  }
});

// 通用图片上传接口（用于动态图片）
router.post('/image', authMiddleware, (req, res, next) => {
  imageUpload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer错误:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          code: 1,
          message: '文件大小超过限制（最大5MB）' 
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ 
          code: 1,
          message: '文件字段名不正确' 
        });
      }
      return res.status(400).json({ 
        code: 1,
        message: '文件上传错误: ' + err.message 
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('开始处理图片上传请求');
    console.log('用户ID:', req.user.id);
    console.log('文件信息:', req.file);
    
    if (!req.file) {
      console.log('没有接收到文件');
      return res.status(400).json({ 
        code: 1,
        message: '请选择要上传的图片文件' 
      });
    }

    console.log('图片上传成功:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // 生成文件访问URL
    const imageUrl = `/uploads/images/${req.file.filename}`;
    
    console.log('图片URL生成成功:', imageUrl);
    res.json({ 
      code: 0,
      message: '图片上传成功',
      data: {
        url: imageUrl,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('图片上传处理失败:', error);
    res.status(500).json({ 
      code: 1,
      message: '图片上传失败: ' + error.message 
    });
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

// 获取图片接口
router.get('/image/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../../uploads/images', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: '图片文件不存在' });
  }
});

module.exports = router; 