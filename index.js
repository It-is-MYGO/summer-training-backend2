const app = require('./app');
const config = require('./config');
const { connectDB } = require('./lib/database/connection');

const port = config.server.port || 3000;

// 启动服务器前先连接数据库
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});