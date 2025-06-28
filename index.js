const app = require('./app');
const { sequelize, testConnection, syncModels, seedDatabase } = require('./config/db');
const port = process.env.PORT || 5000;

// 数据库连接和服务器启动
async function initializeServer() {
  try {
    console.log('正在启动服务器...');
    
    // 1. 测试数据库连接
    console.log('🔌 正在连接数据库...');
    await testConnection();
    
    // 2. 同步数据库模型
    await syncModels();
    
    // 3. 初始化基础数据 (仅开发环境)
    await seedDatabase();

    // 4. 启动HTTP服务器
    const server = app.listen(port, () => {
      console.log(`=================================`);
      console.log(`🚀 服务器已启动`);
      console.log(`📍 访问地址: http://localhost:${port}`);
      console.log(`🛠️ 运行环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🕒 启动时间: ${new Date().toLocaleString()}`);
      console.log(`=================================`);
    });

    // 优雅关闭处理
    process.on('SIGTERM', () => {
      console.log('收到SIGTERM信号，正在关闭服务器...');
      server.close(async () => {
        await sequelize.close();
        console.log('服务器已关闭，数据库连接已断开');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('收到SIGINT信号，正在关闭服务器...');
      server.close(async () => {
        await sequelize.close();
        console.log('服务器已关闭，数据库连接已断开');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

initializeServer();