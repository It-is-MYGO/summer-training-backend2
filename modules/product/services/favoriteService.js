// 收藏相关业务逻辑（MySQL）
const favoriteRepository = require('../repositories/favoriteRepository');

module.exports = {
  async getFavorites(userId) {
    return await favoriteRepository.findAll(userId);
  },

  async addFavorite(productId, userId) {
    const result = await favoriteRepository.create(productId, userId);
    if (result.duplicate) {
      return { duplicate: true, id: result.id };
    }
    return result;
  },

  async removeFavorite(id) {
    return await favoriteRepository.delete(id);
  },

  async setAlertPrice(id, alertPrice) {
    return await favoriteRepository.updateAlertPrice(id, alertPrice);
  },

  async checkFavorite(userId, productId, favoriteId = null) {
    if (favoriteId) {
      // 通过收藏ID检查
      return await favoriteRepository.checkFavoriteById(userId, favoriteId);
    } else {
      // 通过商品ID检查
      return await favoriteRepository.checkFavorite(userId, productId);
    }
  }
}; 