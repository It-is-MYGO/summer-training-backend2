const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./config/db');
const adminRoutes = require('./modules/admin/routes/admin.routes');
const path = require('path');
const authRoutes = require('./modules/auth/routes/auth.routes');
const postRoutes = require('./modules/post/routes/post.routes');
const uploadRoutes = require('./modules/upload/routes/upload.routes');
// const productRoutes = require('./modules/product/routes/productRoutes');
// const favoriteRoutes = require('./modules/product/routes/favoriteRoutes');
const errorHandler = require('./lib/middleware/errorHandler');

const app = express();


// 1. 添加请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    console.log('检测到文件上传请求');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Content-Length:', req.headers['content-length']);
  }
  next();
});

// ======================
// 中间件配置
// ======================

app.use(helmet()); // 安全防护
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 增加请求体大小限制，特别是对文件上传
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ======================
// 路由配置
// ======================
// 根路由
app.get('/', (req, res) => {
  res.json({ 
    status: '服务运行正常',
    message: '商品比价系统后端服务启动成功！',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      posts: '/api/posts',
      upload: '/api/upload',
      // products: '/api/products',
      // favorites: '/api/favorites'
      管理员接口: '/api/admin',
      健康检查: '/health'
    },
    timestamp: new Date().toISOString()
  });
});

// API测试路由
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API测试成功',
    timestamp: new Date().toISOString(),
    status: 'ok'
  });
});

// 静态文件服务 - 用于访问上传的图片
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/upload', uploadRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/favorites', favoriteRoutes);

// 健康检查路由 - 增强版
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: '健康',
      database: '已连接',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: '服务不可用',
      database: '连接失败',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 管理员路由
app.use('/api/admin', adminRoutes);

// ======================
// 错误处理
// ======================
// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    requestedUrl: req.originalUrl,
    method: req.method
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString()
  });
});

module.exports = app;