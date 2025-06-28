const productRepository = require('../repositories/product.repository');

exports.getAllProducts = async (page, limit, search, status) => {
  const offset = (page - 1) * limit;
  return await productRepository.findAndCountAll(offset, limit, search, status);
};

exports.toggleProductStatus = async (id) => {
  const product = await productRepository.findById(id);
  if (!product) throw new Error('商品不存在');
  
  return await productRepository.update(id, { 
    is_drop: !product.is_drop 
  });
};