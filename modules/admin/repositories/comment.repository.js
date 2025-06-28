const Comment = require('../models/Comment');

class CommentRepository {
  async findById(id) {
    return await Comment.findByPk(id);
  }

  async findByPost(postId, { page = 1, limit = 10 }) {
    return await Comment.findAndCountAll({
      where: { post_id: postId },
      limit,
      offset: (page - 1) * limit,
      order: [['created_at', 'DESC']]
    });
  }

  async create(commentData) {
    return await Comment.create(commentData);
  }

  async update(id, updateData) {
    const comment = await Comment.findByPk(id);
    if (!comment) throw new Error('Comment not found');
    return await comment.update(updateData);
  }

  async delete(id) {
    const comment = await Comment.findByPk(id);
    if (!comment) throw new Error('Comment not found');
    return await comment.destroy();
  }
}

module.exports = new CommentRepository();