// 集中管理常量
module.exports = {
  JWT: {
    SECRET_KEY: 'Whu123456',
    EXPIRES_IN: '24h'
  },
  DB_ERROR_CODES: {
    DUPLICATE_ENTRY: 'ER_DUP_ENTRY'
  },
  // 新增：图片基础URL和上传路径
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  UPLOADS_PATH: '/uploads/images/'
};