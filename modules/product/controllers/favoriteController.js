const favoriteService = require('../services/favoriteService');

module.exports = {
  async getFavorites(req, res) {
    try {
      const userId = req.query.userId;
      if (!userId) {
        return res.status(400).json({ message: '用户ID不能为空' });
      }
      const favorites = await favoriteService.getFavorites(userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: '获取收藏列表失败', error: error.message });
    }
  },

  async addFavorite(req, res) {
    try {
      const { productId, userId } = req.body;
      if (!productId || !userId) {
        return res.status(400).json({ message: '商品ID和用户ID不能为空' });
      }
      const result = await favoriteService.addFavorite(productId, userId);
      if (result.duplicate) {
        return res.status(200).json({ message: '该商品已收藏', id: result.id, duplicate: true });
      }
      res.json({ message: '添加收藏成功', id: result.insertId });
    } catch (error) {
      res.status(500).json({ message: '添加收藏失败', error: error.message });
    }
  },

  async removeFavorite(req, res) {
    try {
      const { id } = req.params;
      const result = await favoriteService.removeFavorite(id);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: '收藏不存在' });
      }
      
      res.json({ message: '移除收藏成功' });
    } catch (error) {
      res.status(500).json({ message: '移除收藏失败', error: error.message });
    }
  },

  async setAlertPrice(req, res) {
    try {
      const { id } = req.params;
      const { alertPrice } = req.body;
      
      if (!alertPrice || alertPrice <= 0) {
        return res.status(400).json({ message: '提醒价格必须大于0' });
      }
      
      const result = await favoriteService.setAlertPrice(id, alertPrice);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: '收藏不存在' });
      }
      
      res.json({ message: '设置提醒价格成功' });
    } catch (error) {
      res.status(500).json({ message: '设置提醒价格失败', error: error.message });
    }
  },

  async checkFavorite(req, res) {
    try {
      const { userId, productId } = req.query;
      if (!userId || !productId) {
        return res.status(400).json({ message: '用户ID和商品ID不能为空' });
      }
      const result = await favoriteService.checkFavorite(userId, productId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: '查询收藏状态失败', error: error.message });
    }
  }
};
