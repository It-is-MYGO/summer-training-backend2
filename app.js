require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./config/db');
const adminRoutes = require('./modules/admin/routes/admin.routes');

const app = express();

// ======================
// 中间件配置
// ======================
app.use(helmet()); // 安全防护
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev')); // 请求日志
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL编码解析

// ======================
// 路由配置
// ======================
// 根路由
app.get('/', (req, res) => {
  res.json({
    status: '服务运行正常',
    message: '欢迎使用后端API服务',
    endpoints: {
      文档: '/api-docs',
      管理员接口: '/api/admin',
      健康检查: '/health'
    },
    timestamp: new Date().toISOString()
  });
});

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