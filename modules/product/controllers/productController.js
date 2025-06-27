// 处理商品相关的HTTP请求
const productService = require('../services/productService');
module.exports = {
  async getHotProducts(ctx) {
    ctx.body = await productService.getHotProducts();
  },
  async getDropProducts(ctx) {
    ctx.body = await productService.getDropProducts();
  },
  async search(ctx) {
    const { keyword } = ctx.query;
    ctx.body = await productService.searchProducts(keyword);
  },
  async getDetail(ctx) {
    const { id } = ctx.params;
    ctx.body = await productService.getProductDetail(id);
  },
  async getPriceHistory(ctx) {
    const { id } = ctx.params;
    ctx.body = await productService.getPriceHistory(id);
  },
  async getPlatformPrices(ctx) {
    const { id } = ctx.params;
    ctx.body = await productService.getPlatformPrices(id);
  }
};
