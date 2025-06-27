// 收藏相关业务逻辑（MySQL）
const favoriteRepository = require('../repositories/favoriteRepository');

module.exports = {
  async getFavorites(userId) {
    const favorites = await favoriteRepository.findByUserId(userId);
    
    // 为每个收藏的商品获取最新价格信息
    const favoritesWithPrices = await Promise.all(
      favorites.map(async (favorite) => {
        const product = await favoriteRepository.findProductById(favorite.product_id);
        const latestPrice = await favoriteRepository.findLatestPrice(favorite.product_id);
        
        return {
          id: favorite.id,
          product_id: favorite.product_id,
          alert_price: parseFloat(favorite.alert_price),
          product: product,
          current_price: latestPrice ? parseFloat(latestPrice.price) : 0,
          price_change: latestPrice ? parseFloat(latestPrice.price) - parseFloat(favorite.alert_price) : 0
        };
      })
    );
    
    return favoritesWithPrices;
  },

  async addFavorite(userId, productId, alertPrice) {
    // 检查是否已经收藏
    const existing = await favoriteRepository.findByUserAndProduct(userId, productId);
    if (existing) {
      throw new Error('该商品已在收藏夹中');
    }
    
    const result = await favoriteRepository.create({
      user_id: userId,
      product_id: productId,
      alert_price: alertPrice || 0
    });
    
    return { id: result.insertId, message: '添加收藏成功' };
  },

  async removeFavorite(userId, favoriteId) {
    const result = await favoriteRepository.deleteById(userId, favoriteId);
    if (result.affectedRows === 0) {
      throw new Error('收藏记录不存在或无权限删除');
    }
    
    return { message: '移除收藏成功' };
  },

  async setAlertPrice(userId, favoriteId, alertPrice) {
    const result = await favoriteRepository.updateAlertPrice(userId, favoriteId, alertPrice);
    if (result.affectedRows === 0) {
      throw new Error('收藏记录不存在或无权限修改');
    }
    
    return { message: '设置提醒价格成功' };
  }
}; 