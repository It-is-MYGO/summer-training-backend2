module.exports = (err, req, res, next) => {
  console.error('[Error]', err.stack);

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