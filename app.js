const express = require('express');
const cors = require('cors');
const authRoutes = require('./modules/auth/routes/auth.routes');
const errorHandler = require('./lib/middleware/errorHandler');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/auth', authRoutes);

// 错误处理（必须放在最后）
app.use(errorHandler);

module.exports = app;