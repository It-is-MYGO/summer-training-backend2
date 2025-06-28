const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

// 测试连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connection established.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    throw error;
  }
};

// 同步数据库模型
const syncModels = async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      // 开发环境 - 自动修改表结构
      await sequelize.sync({ alter: true });
      console.log('🔄 数据库模型已同步 (alter模式)');
    } else if (process.env.NODE_ENV === 'test') {
      // 测试环境 - 强制重建表
      await sequelize.sync({ force: true });
      console.log('🔄 数据库模型已同步 (force模式)');
    } else {
      // 生产环境 - 只创建不存在的表
      await sequelize.sync();
      console.log('🔄 数据库模型已同步 (safe模式)');
    }
  } catch (error) {
    console.error('❌ 数据库同步失败:', error);
    throw error;
  }
};

// 初始化基础数据
const seedDatabase = async () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  try {
    // 这里可以添加初始化数据
    // 例如: await User.create({ username: 'admin', ... });
    console.log('🌱 基础数据已初始化');
  } catch (error) {
    console.error('❌ 数据初始化失败:', error);
  }
};

module.exports = { 
  sequelize, 
  testConnection,
  syncModels,
  seedDatabase
};