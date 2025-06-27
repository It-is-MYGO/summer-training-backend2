// 处理商品相关的业务逻辑
const productRepository = require('../repositories/productRepository');
module.exports = {
  async searchProducts(keyword) {
    return productRepository.findByKeyword(keyword);
  },
  // 其他业务
};
