const favoriteService = require('../services/favoriteService');
module.exports = {
  async getFavorites(ctx) {
    const userId = ctx.state.user.id; // 假设有登录
    ctx.body = await favoriteService.getFavorites(userId);
  },
  async addFavorite(ctx) {
    const userId = ctx.state.user.id;
    const { product_id, alert_price } = ctx.request.body;
    ctx.body = await favoriteService.addFavorite(userId, product_id, alert_price);
  },
  async removeFavorite(ctx) {
    const userId = ctx.state.user.id;
    const { id } = ctx.params;
    ctx.body = await favoriteService.removeFavorite(userId, id);
  },
  async setAlertPrice(ctx) {
    const userId = ctx.state.user.id;
    const { id } = ctx.params;
    const { alert_price } = ctx.request.body;
    ctx.body = await favoriteService.setAlertPrice(userId, id, alert_price);
  }
};
