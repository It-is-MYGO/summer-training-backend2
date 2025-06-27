const favoriteService = require('../services/favoriteService');

module.exports = {
  async getFavorites(req, res) {
    try {
      const userId = req.user?.id || 1; // 临时使用默认用户ID，实际应该从JWT获取
      const favorites = await favoriteService.getFavorites(userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: '获取收藏失败', error: error.message });
    }
  },

  async addFavorite(req, res) {
    try {
      const userId = req.user?.id || 1;
      const { product_id, alert_price } = req.body;
      
      if (!product_id) {
        return res.status(400).json({ message: '商品ID不能为空' });
      }
      
      const result = await favoriteService.addFavorite(userId, product_id, alert_price);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: '添加收藏失败', error: error.message });
    }
  },

  async removeFavorite(req, res) {
    try {
      const userId = req.user?.id || 1;
      const { id } = req.params;
      
      const result = await favoriteService.removeFavorite(userId, id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: '移除收藏失败', error: error.message });
    }
  },

  async setAlertPrice(req, res) {
    try {
      const userId = req.user?.id || 1;
      const { id } = req.params;
      const { alert_price } = req.body;
      
      if (!alert_price || alert_price <= 0) {
        return res.status(400).json({ message: '提醒价格必须大于0' });
      }
      
      const result = await favoriteService.setAlertPrice(userId, id, alert_price);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: '设置提醒价格失败', error: error.message });
    }
  }
};
