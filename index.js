const app = require('./app');
const config = require('./config');
const { connectDB } = require('./lib/database/connection');

const port = process.env.PORT || 3000;

// 测试数据库连接
pool.getConnection()
  .then(conn => {
    console.log('✅ Database connected successfully');
    conn.release();
    
    // 启动服务器
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
      console.log(`📊 API Documentation: http://localhost:${port}/api`);
    });
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.log('💡 Please check your database configuration in config/database.js');
    process.exit(1);
  });

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  pool.end();
  process.exit(0);
});