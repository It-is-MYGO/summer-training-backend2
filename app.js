const express = require('express');
const cors = require('cors');
const authRoutes = require('./modules/auth/routes/auth.routes');
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

// 路由
app.use('/api/auth', authRoutes);
app.get('/hello', (req, res) => {
  res.send('Hello World!');
});

// 3. 添加 404 处理器
app.all('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint Not Found',
    path: req.originalUrl,
    method: req.method,
    suggested: '/api/auth or /hello'
  });
});

// 错误处理（必须放在最后）
app.use(errorHandler);

module.exports = app;