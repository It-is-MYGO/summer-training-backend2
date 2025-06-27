const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');

// 上传单张图片
router.post('/image', uploadController.uploadImage);

// 上传多张图片
router.post('/images', uploadController.uploadMultipleImages);

// 删除图片
router.delete('/image/:filename', uploadController.deleteImage);

module.exports = router; 