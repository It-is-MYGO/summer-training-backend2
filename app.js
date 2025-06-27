const express = require('express');
const cors = require('cors');
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
  next();
});

// 中间件
app.use(cors());
app.use(express.json());

// 2. 添加根路由
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Welcome to the API',
    endpoints: [
      { path: '/hello', method: 'GET', description: 'Test endpoint' },
      { path: '/api/auth', method: 'POST', description: 'Authentication' }
    ]
  });
});
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 用于访问上传的图片
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/upload', uploadRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/favorites', favoriteRoutes);

// 根路径测试
app.get('/', (req, res) => {
  res.json({ 
    message: '商品比价系统后端服务启动成功！',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      // products: '/api/products',
      // favorites: '/api/favorites'
    }
  });
});

// 错误处理（必须放在最后）
app.use(errorHandler);

module.exports = app;