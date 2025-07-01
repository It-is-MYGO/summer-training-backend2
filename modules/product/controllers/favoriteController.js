const favoriteService = require('../services/favoriteService');

module.exports = {
  async getFavorites(req, res) {
    try {
      const userId = req.query.userId || req.body.userId || 1; // 默认用户ID为1
      const favorites = await favoriteService.getFavorites(userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: '获取收藏列表失败', error: error.message });
    }
  },

  async addFavorite(req, res) {
    try {
      const { productId, userId } = req.body;
      const finalUserId = userId || 1; // 默认用户ID为1
      
      if (!productId) {
        return res.status(400).json({ message: '商品ID不能为空' });
      }
      
      const result = await favoriteService.addFavorite(productId, finalUserId);
      if (result.duplicate) {
        return res.status(200).json({ 
          exists: true, 
          id: result.id,
          message: '该商品已收藏'
        });
      }
      res.json({ 
        exists: false, 
        id: result.insertId,
        message: '添加收藏成功' 
      });
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

  async setAlertPriceNoAuth(req, res) {
    try {
      const { id } = req.params;
      const { alertPrice, userId } = req.body;
      const queryUserId = req.query.userId;
      const finalUserId = userId || queryUserId || 1; // 优先从body获取，其次从query获取，最后默认值
      
      if (!alertPrice || alertPrice <= 0) {
        return res.status(400).json({ message: '提醒价格必须大于0' });
      }
      
      // 验证该收藏是否属于该用户
      const checkResult = await favoriteService.checkFavorite(finalUserId, null, id);
      if (!checkResult.exists) {
        return res.status(404).json({ message: '收藏不存在或无权限' });
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
      const { productId, userId } = req.query;
      const finalUserId = userId || 1; // 默认用户ID为1
      
      if (!productId) {
        return res.status(400).json({ message: '商品ID不能为空' });
      }
      
      const result = await favoriteService.checkFavorite(finalUserId, productId);
      // 确保返回格式一致
      res.json({
        exists: result.exists,
        id: result.id,
        message: result.exists ? '该商品已收藏' : '该商品未收藏'
      });
    } catch (error) {
      res.status(500).json({ message: '查询收藏状态失败', error: error.message });
    }
  }
};
