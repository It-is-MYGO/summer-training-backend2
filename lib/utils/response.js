/**
 * 统一处理成功响应
 * @param {Object} res Express响应对象
 * @param {Object} options 配置项
 * @param {*} options.data 返回的数据
 * @param {string} options.message 成功消息
 * @param {number} options.statusCode HTTP状态码，默认为200
 */
const handleSuccess = (res, { data = null, message = '操作成功', statusCode = 200 }) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

module.exports = {
  handleSuccess,
};