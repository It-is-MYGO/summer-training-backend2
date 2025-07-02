const recommendService = require('../services/recommend.service');

exports.recommendForUser = async (req, res) => {
  const userId = req.params.userId;
  
  try {
    // 混合推荐
    const result = await recommendService.hybridRecommend(userId);
    res.json({ code: 0, data: result });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
};
