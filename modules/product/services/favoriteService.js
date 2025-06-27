// 收藏相关业务逻辑（MySQL）
const favoriteRepository = require('../repositories/favoriteRepository');

module.exports = {
  async getFavorites() {
    return await favoriteRepository.findAll();
  },

  async addFavorite(productId, userId) {
    return await favoriteRepository.create(productId, userId);
  },

  async removeFavorite(id) {
    return await favoriteRepository.delete(id);
  },

  async setAlertPrice(id, alertPrice) {
    return await favoriteRepository.updateAlertPrice(id, alertPrice);
  }
}; 