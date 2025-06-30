const postService = require('../services/post.service');

class PostController {
  // 创建动态
  async createPost(req, res) {
    try {
      console.log('创建动态请求体:', req.body);
      console.log('当前用户:', req.user);
      
      const { content, images, timestamp, tags, location, visibility, product } = req.body;
      const userId = req.user.id;
      
      console.log('解析后的数据:', {
        content,
        images,
        userId,
        timestamp,
        tags,
        location,
        visibility,
        product
      });
      
      const postData = {
        content,
        images: images || [],
        userId,
        timestamp,
        tags: tags || [],
        location: location || null,
        visibility: visibility || 'public',
        product: product || null
      };
      
      console.log('准备创建动态数据:', postData);
      
      const post = await postService.createPost(postData);
      res.json({
        code: 0,
        message: '动态发布成功',
        data: post.toJSON()
      });
    } catch (error) {
      console.error('创建动态失败:', error.message);
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
      const { content, images, tags, location, visibility, product } = req.body;
      const userId = req.user.id;
      
      // 验证参数
      if (!id || id === 'undefined') {
        return res.status(400).json({
          code: 1,
          message: '动态ID不能为空',
          data: null
        });
      }
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          code: 1,
          message: '动态内容不能为空',
          data: null
        });
      }
      
      const updateData = {
        content: content.trim(),
        images: images || [],
        tags: tags || [],
        location: location || null,
        visibility: visibility || 'public',
        product: product || null
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
      const userId = req.user.id;
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

  // 删除用户所有动态
  async deleteAllUserPosts(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.id;
      
      console.log('删除用户所有动态请求:', {
        targetUserId: userId,
        currentUserId: currentUserId,
        params: req.params,
        user: req.user
      });
      
      const result = await postService.deleteAllUserPosts(parseInt(userId), currentUserId);
      res.json({
        code: 0,
        message: `成功删除 ${result.deletedCount} 条动态`,
        data: {
          deletedCount: result.deletedCount
        }
      });
    } catch (error) {
      console.error('删除用户所有动态失败:', error.message);
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
      const { like } = req.body;
      const userId = req.user.id;
      
      // 验证postId参数
      if (!id || id === 'undefined') {
        return res.status(400).json({
          code: 1,
          message: '动态ID不能为空',
          data: null
        });
      }
      
      // 验证like参数
      if (like === undefined) {
        return res.status(400).json({
          code: 1,
          message: '点赞参数不能为空',
          data: null
        });
      }
      
      // 确保like是布尔值
      const likeValue = Boolean(like);
      
      const result = await postService.toggleLike(id, userId, likeValue);
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
      const { collect } = req.body;
      const userId = req.user.id;
      
      // 验证postId参数
      if (!id || id === 'undefined') {
        return res.status(400).json({
          code: 1,
          message: '动态ID不能为空',
          data: null
        });
      }
      
      // 验证collect参数
      if (collect === undefined) {
        return res.status(400).json({
          code: 1,
          message: '收藏参数不能为空',
          data: null
        });
      }
      
      // 确保collect是布尔值
      const collectValue = Boolean(collect);
      
      const result = await postService.toggleCollect(id, userId, collectValue);
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
      const { content } = req.body;
      const userId = req.user.id;
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
      const userId = req.user.id;
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

  // 获取动态评论列表
  async getComments(req, res) {
    try {
      const { id } = req.params;
      const {
        page = 1,
        pageSize = 20,
        sort = 'latest'
      } = req.query;

      const options = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        sort
      };

      const result = await postService.getComments(id, options);

      res.json({
        code: 0,
        message: 'success',
        data: {
          list: result.list,
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

  // 获取用户收藏的动态列表
  async getUserCollections(req, res) {
    try {
      const { userId } = req.params;
      const {
        page = 1,
        pageSize = 10,
        sort = 'latest'
      } = req.query;
      const currentUserId = req.user?.id || null;

      // 验证权限：只能查看自己的收藏
      if (parseInt(userId) !== currentUserId) {
        return res.status(403).json({
          code: 1,
          message: '没有权限查看他人的收藏',
          data: null
        });
      }

      const options = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        sort,
        userId: parseInt(userId)
      };

      const result = await postService.getUserCollections(options);

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
      res.status(400).json({
        code: 1,
        message: error.message,
        data: null
      });
    }
  }

  // 获取用户个人动态
  async getUserPosts(req, res) {
    try {
      const { userId } = req.params;
      const {
        page = 1,
        pageSize = 10,
        sort = 'latest'
      } = req.query;
      const currentUserId = req.user?.id || null;

      const options = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        sort,
        targetUserId: parseInt(userId),
        currentUserId
      };

      const result = await postService.getUserPosts(options);

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
}

module.exports = new PostController(); 