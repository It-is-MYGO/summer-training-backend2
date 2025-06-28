const productService = require('../services/product.service');
const { handleSuccess } = require('../../../lib/utils/response');
exports.getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const products = await productService.getAllProducts(page, limit, search, status);
    handleSuccess(res, { data: products });
  } catch (error) {
    next(error);
  }
};

exports.toggleProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.toggleProductStatus(id);
    handleSuccess(res, { 
      data: product, 
      message: product.is_drop ? '商品已下架' : '商品已上架' 
    });
  } catch (error) {
    next(error);
  }
};