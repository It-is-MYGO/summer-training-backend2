const postRepository = require('../repositories/post.repository');
const userRepository = require('../../user/repositories/user.repository');
const fs = require('fs');
const path = require('path');
const { pool } = require('../../../lib/database/connection');

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

      // 新增：动态发布成功后增加活跃度
      await userRepository.increaseActivity(postData.userId);

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

      // 编辑后状态设为 pending，需审核
      const success = await postRepository.update(id, { ...updateData, status: 'pending' });
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
      // 只在status为undefined或null时赋值'approved'，其他情况一律不覆盖
      if (options.status === undefined || options.status === null) {
        options.status = 'approved';
      }
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
      const query = 'SELECT isadmin FROM users WHERE id = ?';
      const [rows] = await pool.execute(query, [userId]);
      return rows.length > 0 && rows[0].isadmin === 1;
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
      // 修正：只要like为true就增加活跃度
      if (like) {
        await userRepository.increaseActivity(userId);
      }
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
      // 修正：只要collect为true就增加活跃度
      if (collect) {
        await userRepository.increaseActivity(userId);
      }
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
      // 新增：评论成功后增加活跃度
      await userRepository.increaseActivity(userId);
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
      // 判断用户是否有行为数据
      const [rows] = await pool.query(
        'SELECT COUNT(*) as cnt FROM (SELECT id FROM post_likes WHERE userId=? UNION SELECT id FROM post_collections WHERE userId=? UNION SELECT id FROM post_comments WHERE userId=?) t',
        [userId, userId, userId]
      );
      if (rows[0].cnt === 0) {
        // 新用户，返回热门动态
        const hotSql = `WITH hot_posts AS (\n\
          SELECT p.*,\n\
                 (COALESCE(l.like_count,0)*2 + COALESCE(c.collect_count,0)*3 + COALESCE(cm.comment_count,0)*1) AS hot_score,\n\
                 (SELECT COUNT(*) FROM post_likes WHERE postId = p.id) AS likes,\n\
                 (SELECT COUNT(*) FROM post_comments WHERE postId = p.id) AS comments,\n\
                 (SELECT COUNT(*) FROM post_collections WHERE postId = p.id) AS collections\n\
          FROM posts p\n\
          LEFT JOIN (\n\
            SELECT postId, COUNT(*) AS like_count\n\
            FROM post_likes\n\
            WHERE createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY)\n\
            GROUP BY postId\n\
          ) l ON l.postId = p.id\n\
          LEFT JOIN (\n\
            SELECT postId, COUNT(*) AS collect_count\n\
            FROM post_collections\n\
            WHERE createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY)\n\
            GROUP BY postId\n\
          ) c ON c.postId = p.id\n\
          LEFT JOIN (\n\
            SELECT postId, COUNT(*) AS comment_count\n\
            FROM post_comments\n\
            WHERE createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY)\n\
            GROUP BY postId\n\
          ) cm ON cm.postId = p.id\n\
          WHERE p.status = 'approved'\n\
          ORDER BY hot_score DESC, p.createdAt DESC\n\
        )\n\
        SELECT * FROM hot_posts LIMIT ${limit};`;
        const [hotRows] = await pool.query(hotSql);
        return hotRows;
      } else {
        // 老用户，走协同过滤
        const fs = require('fs');
        const path = require('path');
        const sql = fs.readFileSync(
          path.join(__dirname, '../../../database/recommend_posts.sql'),
          'utf8'
        );
        // 只取协同过滤部分，防止执行到冷启动SQL
        const recommendSql = sql.split('-- 热门动态推荐')[0];
        const finalSql = recommendSql.replace(/:userId/g, userId).replace(/LIMIT 10;/, `LIMIT ${limit};`);
        const [rows] = await pool.query(finalSql);
        return rows;
      }
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
<<<<<<< HEAD

  // 新增：管理员审核动态
  async updatePostStatus(id, status, adminId) {
    // 校验管理员权限
    const isAdmin = await this.checkUserIsAdmin(adminId);
    if (!isAdmin) {
      throw new Error('没有审核权限');
    }
    // 只允许 approved/rejected
    if (!['approved', 'rejected'].includes(status)) {
      throw new Error('无效的审核状态');
    }
    const success = await postRepository.updateStatus(id, status);
    if (!success) {
      throw new Error('审核失败，动态不存在');
    }
    return { id, status };
  }
=======
>>>>>>> origin/pachong
}

module.exports = new PostService(); 