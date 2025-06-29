const postService = require('../services/post.service');

class PostController {
  // 创建动态
  async createPost(req, res) {
    try {
<<<<<<< Updated upstream
      const { content, images, userId, timestamp, tags, location, visibility, product } = req.body;
=======
      const { content, images, timestamp, tags, location, visibility, product } = req.body;
      const userId = req.user.id;
>>>>>>> Stashed changes

      const postData = {
        content,
        images: images || [],
        userId,
        timestamp,
        tags: tags || [],
        location,
        visibility,
        product
      };

      const post = await postService.createPost(postData);

      res.json({
        code: 0,
        message: '动态发布成功',
        data: post.toJSON()
      });
    } catch (error) {
      res.status(400).json({
        code: 1,
        message: error.message,
        data: null
      });
    }
  }

  // 更新动态
  async updatePost(req, res) {
    try {
      const { id } = req.params;
      const { content, images, userId, tags, location, visibility, product } = req.body;

      const updateData = {
        content,
        images: images || [],
        tags: tags || [],
        location,
        visibility,
        product
      };

      const post = await postService.updatePost(id, updateData, userId);

      res.json({
        code: 0,
        message: '动态更新成功',
        data: post.toJSON()
      });
    } catch (error) {
      res.status(400).json({
        code: 1,
        message: error.message,
        data: null
      });
    }
  }

  // 获取动态详情
  async getPostById(req, res) {
    try {
      const { id } = req.params;
      const currentUserId = req.query.userId || req.body.userId || null;

      const post = await postService.getPostById(id, currentUserId);

      res.json({
        code: 0,
        message: '获取成功',
        data: post.toJSON()
      });
    } catch (error) {
      res.status(404).json({
        code: 1,
        message: error.message,
        data: null
      });
    }
  }

  // 获取动态列表
  async getPosts(req, res) {
    try {
      const {
        page = 1,
        pageSize = 10,
        keyword = '',
        tag = '',
        sort = 'latest',
        userId = null
      } = req.query;

      const options = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        keyword,
        tag,
        sort,
        currentUserId: userId
      };

      const result = await postService.getPosts(options);

      res.json({
        code: 0,
        message: 'success',
        data: {
          list: result.list.map(post => post.toJSON()),
          total: result.total,
          page: result.page,
          pageSize: result.pageSize
        }
      });
    } catch (error) {
      res.status(400).json({
        code: 1,
        message: error.message,
        data: null
      });
    }
  }

  // 删除动态
  async deletePost(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      await postService.deletePost(id, userId);

      res.json({
        code: 0,
        message: '删除成功',
        data: null
      });
    } catch (error) {
      res.status(400).json({
        code: 1,
        message: error.message,
        data: null
      });
    }
  }

  // 点赞/取消点赞
  async toggleLike(req, res) {
    try {
      const { id } = req.params;
      const { userId, like } = req.body;

      const result = await postService.toggleLike(id, userId, like);

      res.json({
        code: 0,
        message: 'success',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        code: 1,
        message: error.message,
        data: null
      });
    }
  }

  // 收藏/取消收藏
  async toggleCollect(req, res) {
    try {
      const { id } = req.params;
      const { userId, collect } = req.body;

      const result = await postService.toggleCollect(id, userId, collect);

      res.json({
        code: 0,
        message: 'success',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        code: 1,
        message: error.message,
        data: null
      });
    }
  }

  // 添加评论
  async addComment(req, res) {
    try {
      const { id } = req.params;
      const { userId, content } = req.body;

      const comment = await postService.addComment(id, userId, content);

      res.json({
        code: 0,
        message: '评论成功',
        data: comment
      });
    } catch (error) {
      res.status(400).json({
        code: 1,
        message: error.message,
        data: null
      });
    }
  }

  // 删除评论
  async deleteComment(req, res) {
    try {
      const { commentId } = req.params;
      const { userId } = req.body;

      await postService.deleteComment(commentId, userId);

      res.json({
        code: 0,
        message: '删除评论成功',
        data: null
      });
    } catch (error) {
      res.status(400).json({
        code: 1,
        message: error.message,
        data: null
      });
    }
  }

  // 获取标签列表
  async getTags(req, res) {
    try {
      const tags = await postService.getTags();

      res.json({
        code: 0,
        message: 'success',
        data: tags
      });
    } catch (error) {
      res.status(400).json({
        code: 1,
        message: error.message,
        data: null
      });
    }
  }

  // 获取推荐动态
  async getRecommendPosts(req, res) {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId) : null;
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const posts = await postService.getRecommendPosts(userId, limit);
      res.json({
        code: 0,
        message: 'success',
        data: posts.map(post => post.toJSON())
      });
    } catch (error) {
      console.error('getRecommendPosts error:', error);
      res.status(400).json({
        code: 1,
        message: error.message,
        data: null
      });
    }
  }
}

module.exports = new PostController(); 