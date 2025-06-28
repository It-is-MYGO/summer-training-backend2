const postRepository = require('../repositories/post.repository');

class PostService {
  // 创建动态
  async createPost(postData) {
    try {
      // 验证必填字段
      if (!postData.content || !postData.userId) {
        throw new Error('动态内容和用户ID不能为空');
      }

      // 验证图片数量
      if (postData.images && postData.images.length > 4) {
        throw new Error('图片数量不能超过4张');
      }

      // 设置默认时间戳
      const timestamp = postData.timestamp || new Date().toISOString();

      const postId = await postRepository.create({
        ...postData,
        timestamp
      });

      // 返回创建的动态详情
      const post = await postRepository.findById(postId, postData.userId);
      return post;
    } catch (error) {
      throw error;
    }
  }

  // 更新动态
  async updatePost(id, updateData, userId) {
    try {
      // 验证权限
      const existingPost = await postRepository.findById(id, userId);
      if (!existingPost) {
        throw new Error('动态不存在');
      }

      if (!existingPost.canEdit) {
        throw new Error('没有编辑权限');
      }

      // 验证图片数量
      if (updateData.images && updateData.images.length > 4) {
        throw new Error('图片数量不能超过4张');
      }

      const success = await postRepository.update(id, updateData);
      if (!success) {
        throw new Error('更新失败');
      }

      // 返回更新后的动态详情
      const updatedPost = await postRepository.findById(id, userId);
      return updatedPost;
    } catch (error) {
      throw error;
    }
  }

  // 获取动态详情
  async getPostById(id, currentUserId = null) {
    try {
      const post = await postRepository.findById(id, currentUserId);
      if (!post) {
        throw new Error('动态不存在');
      }
      return post;
    } catch (error) {
      throw error;
    }
  }

  // 获取动态列表
  async getPosts(options = {}) {
    try {
      const posts = await postRepository.findAll(options);
      return posts;
    } catch (error) {
      throw error;
    }
  }

  // 删除动态
  async deletePost(id, userId) {
    try {
      // 验证权限
      const existingPost = await postRepository.findById(id, userId);
      if (!existingPost) {
        throw new Error('动态不存在');
      }

      if (!existingPost.canDelete) {
        throw new Error('没有删除权限');
      }

      const success = await postRepository.delete(id, userId);
      if (!success) {
        throw new Error('删除失败');
      }

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // 删除用户所有动态
  async deleteAllUserPosts(targetUserId, currentUserId) {
    try {
      // 验证权限：只能删除自己的动态或管理员可以删除任何人的动态
      if (targetUserId !== currentUserId) {
        // 检查当前用户是否为管理员
        const isAdmin = await this.checkUserIsAdmin(currentUserId);
        if (!isAdmin) {
          throw new Error('没有删除权限');
        }
      }

      const deletedCount = await postRepository.deleteAllUserPosts(targetUserId, currentUserId);
      return { success: true, deletedCount };
    } catch (error) {
      throw error;
    }
  }

  // 检查用户是否为管理员
  async checkUserIsAdmin(userId) {
    try {
      const { pool } = require('../../../lib/database/connection');
      const query = 'SELECT role FROM users WHERE id = ?';
      const [rows] = await pool.execute(query, [userId]);
      return rows.length > 0 && rows[0].role === 'admin';
    } catch (error) {
      return false;
    }
  }

  // 点赞/取消点赞
  async toggleLike(postId, userId, like) {
    try {
      // 验证动态是否存在
      const post = await postRepository.findById(postId);
      if (!post) {
        throw new Error('动态不存在');
      }

      const result = await postRepository.toggleLike(postId, userId, like);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // 收藏/取消收藏
  async toggleCollect(postId, userId, collect) {
    try {
      // 验证动态是否存在
      const post = await postRepository.findById(postId);
      if (!post) {
        throw new Error('动态不存在');
      }

      const result = await postRepository.toggleCollect(postId, userId, collect);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // 添加评论
  async addComment(postId, userId, content) {
    try {
      // 验证动态是否存在
      const post = await postRepository.findById(postId);
      if (!post) {
        throw new Error('动态不存在');
      }

      // 验证评论内容
      if (!content || content.trim().length === 0) {
        throw new Error('评论内容不能为空');
      }

      if (content.length > 500) {
        throw new Error('评论内容不能超过500字');
      }

      const comment = await postRepository.addComment(postId, userId, content.trim());
      return comment;
    } catch (error) {
      throw error;
    }
  }

  // 删除评论
  async deleteComment(commentId, userId) {
    try {
      const success = await postRepository.deleteComment(commentId, userId);
      if (!success) {
        throw new Error('删除评论失败或没有权限');
      }
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // 获取动态评论列表
  async getComments(postId, options = {}) {
    try {
      // 验证动态是否存在
      const post = await postRepository.findById(postId);
      if (!post) {
        throw new Error('动态不存在');
      }

      const comments = await postRepository.getComments(postId, options);
      return comments;
    } catch (error) {
      throw error;
    }
  }

  // 获取用户收藏的动态列表
  async getUserCollections(options = {}) {
    try {
      const { userId } = options;
      
      // 验证用户ID
      if (!userId || isNaN(userId)) {
        throw new Error('用户ID无效');
      }

      const collections = await postRepository.getUserCollections(options);
      return collections;
    } catch (error) {
      throw error;
    }
  }

  // 获取标签列表
  async getTags() {
    try {
      const tags = await postRepository.getTags();
      return tags;
    } catch (error) {
      throw error;
    }
  }

  // 获取推荐动态
  async getRecommendPosts(userId, limit = 10) {
    try {
      // 这里可以实现推荐算法，暂时返回最新动态
      const posts = await postRepository.findAll({
        page: 1,
        pageSize: limit,
        sort: 'latest',
        currentUserId: userId
      });
      return posts.list;
    } catch (error) {
      throw error;
    }
  }

  // 获取用户个人动态
  async getUserPosts(options = {}) {
    try {
      const {
        page = 1,
        pageSize = 10,
        sort = 'latest',
        targetUserId,
        currentUserId = null
      } = options;

      // 验证目标用户ID
      if (!targetUserId || isNaN(targetUserId)) {
        throw new Error('用户ID无效');
      }

      // 检查权限：只能查看自己的动态或公开动态
      const canViewPrivate = currentUserId && (currentUserId === targetUserId);

      const posts = await postRepository.findUserPosts({
        page,
        pageSize,
        sort,
        targetUserId,
        currentUserId,
        canViewPrivate
      });

      return posts;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PostService(); 