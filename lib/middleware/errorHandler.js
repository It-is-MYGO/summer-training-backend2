module.exports = (err, req, res, next) => {
  console.error('[Error]', err.stack);

  // Multer文件上传错误
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      code: 'FILE_TOO_LARGE',
      message: '文件大小超过限制（最大5MB）',
      detail: err.message
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      code: 'INVALID_FILE_FIELD',
      message: '文件字段名不正确',
      detail: err.message
    });
  }

  // 业务错误（如Service层抛出的错误）
  if (err.isBusinessError) {
    return res.status(400).json({
      code: err.code || 'BUSINESS_ERROR',
      message: err.message,
      detail: err.stack
    });
  }

  // 数据库错误
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      code: 'DUPLICATE_ENTRY',
      message: '数据已存在',
      detail: err.stack
    });
  }

  // 其他错误
  res.status(500).json({
    code: 'SERVER_ERROR',
    message: '服务器内部错误',
    detail: err.message,
    stack: err.stack
  });
};