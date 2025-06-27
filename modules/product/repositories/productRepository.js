// 负责数据库操作
const Product = require('../models/product');
module.exports = {
  async findByKeyword(keyword) {
    // 伪代码，实际根据ORM调整
    return Product.find({ name: new RegExp(keyword, 'i') });
  },
  // 其他数据操作
};
