const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./modules/auth/routes/auth.routes');
const postRoutes = require('./modules/post/routes/post.routes');
const uploadRoutes = require('./modules/upload/routes/upload.routes');
const productRoutes = require('./modules/product/routes/productRoutes');
const favoriteRoutes = require('./modules/product/routes/favoriteRoutes');
const userRoutes = require('./modules/user/routes/user.routes');
const brandRoutes = require('./modules/brand/routes/brand.routes');
const errorHandler = require('./lib/middleware/errorHandler');
const logRoutes = require('./modules/log/routes/log.routes');
const recommendRoutes = require('./modules/recommend/routes/recommend.routes');


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

// 中间件
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 增加请求体大小限制，特别是对文件上传
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 根路径测试
app.get('/', (req, res) => {
  res.json({ 
    message: '商品比价系统后端服务启动成功！',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      posts: '/api/posts',
      upload: '/api/upload',
      products: '/api/products',
      favorites: '/api/favorites',
      users: '/api/users',
      recommend: '/api/recommend'
    }
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
app.use('/api/products', productRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin/posts', postRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/log', logRoutes);
app.use('/api/recommend', recommendRoutes);


// 404处理 - 确保返回JSON格式
app.use('*', (req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `路由 ${req.method} ${req.originalUrl} 不存在`,
    data: null
  });
});

// 错误处理（必须放在最后）
app.use(errorHandler);

module.exports = app;