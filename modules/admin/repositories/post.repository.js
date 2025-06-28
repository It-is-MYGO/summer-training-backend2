const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { Op } = require('sequelize');

class PostRepository {
  async create(postData) {
    return await Post.create(postData);
  }

  async findById(id) {
    return await Post.findByPk(id, {
      include: [{
        model: Comment,
        as: 'comments',
        order: [['created_at', 'DESC']]
      }]
    });
  }

  async findAll({ page = 1, limit = 10, search = '', userId = null }) {
    const where = {};
    if (search) {
      where.content = { [Op.like]: `%${search}%` };
    }
    if (userId) {
      where.user = userId;
    }

    return await Post.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['time', 'DESC']]
    });
  }

  async update(id, updateData) {
    const post = await Post.findByPk(id);
    if (!post) throw new Error('Post not found');
    return await post.update(updateData);
  }

  async delete(id) {
    const post = await Post.findByPk(id);
    if (!post) throw new Error('Post not found');
    return await post.destroy();
  }

  async incrementLikes(id) {
    const post = await Post.findByPk(id);
    if (!post) throw new Error('Post not found');
    return await post.increment('likes');
  }

  async addComment(postId, commentData) {
    const post = await Post.findByPk(postId);
    if (!post) throw new Error('Post not found');
    
    const comment = await Comment.create({
      ...commentData,
      post_id: postId
    });
    
    await post.increment('comments');
    return comment;
  }

  async deleteComment(postId, commentId) {
    const comment = await Comment.findOne({
      where: { id: commentId, post_id: postId }
    });
    if (!comment) throw new Error('Comment not found');
    
    const post = await Post.findByPk(postId);
    if (post) {
      await post.decrement('comments');
    }
    
    return await comment.destroy();
  }
}

module.exports = new PostRepository();