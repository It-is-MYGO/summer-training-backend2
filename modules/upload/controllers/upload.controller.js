const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/images';
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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

// 配置multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  }
});

class UploadController {
  // 上传单张图片
  async uploadImage(req, res) {
    try {
      // 使用multer中间件处理文件上传
      upload.single('file')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            code: 1,
            message: err.message,
            data: null
          });
        }

        if (!req.file) {
          return res.status(400).json({
            code: 1,
            message: '请选择要上传的图片',
            data: null
          });
        }

        const { userId } = req.body;
        
        // 生成访问URL
        const baseUrl = req.protocol + '://' + req.get('host');
        const imageUrl = `${baseUrl}/uploads/images/${req.file.filename}`;

        res.json({
          code: 0,
          message: '上传成功',
          data: {
            url: imageUrl,
            filename: req.file.filename,
            size: req.file.size,
            type: req.file.mimetype
          }
        });
      });
    } catch (error) {
      res.status(500).json({
        code: 1,
        message: '上传失败: ' + error.message,
        data: null
      });
    }
  }

  // 上传多张图片
  async uploadMultipleImages(req, res) {
    try {
      // 使用multer中间件处理多文件上传
      upload.array('files', 4)(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            code: 1,
            message: err.message,
            data: null
          });
        }

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            code: 1,
            message: '请选择要上传的图片',
            data: null
          });
        }

        if (req.files.length > 4) {
          return res.status(400).json({
            code: 1,
            message: '最多只能上传4张图片',
            data: null
          });
        }

        const { userId } = req.body;
        const baseUrl = req.protocol + '://' + req.get('host');
        
        const uploadedFiles = req.files.map(file => ({
          url: `${baseUrl}/uploads/images/${file.filename}`,
          filename: file.filename,
          size: file.size,
          type: file.mimetype
        }));

        res.json({
          code: 0,
          message: '上传成功',
          data: uploadedFiles
        });
      });
    } catch (error) {
      res.status(500).json({
        code: 1,
        message: '上传失败: ' + error.message,
        data: null
      });
    }
  }

  // 删除图片
  async deleteImage(req, res) {
    try {
      const { filename } = req.params;
      const filePath = path.join('uploads/images', filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({
          code: 0,
          message: '删除成功',
          data: null
        });
      } else {
        res.status(404).json({
          code: 1,
          message: '文件不存在',
          data: null
        });
      }
    } catch (error) {
      res.status(500).json({
        code: 1,
        message: '删除失败: ' + error.message,
        data: null
      });
    }
  }
}

module.exports = new UploadController(); 