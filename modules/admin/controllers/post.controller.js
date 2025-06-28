const postService = require('../services/post.service');
const { handleSuccess } = require('../../../lib/utils/response');

exports.getAllPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const posts = await postService.getAllPosts(page, limit, search);
    handleSuccess(res, { data: posts });
  } catch (error) {
    next(error);
  }
};

exports.getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await postService.getPostById(id);
    handleSuccess(res, { data: post });
  } catch (error) {
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    await postService.deletePost(id);
    handleSuccess(res, { message: '动态删除成功' });
  } catch (error) {
    next(error);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;
    await postService.deleteComment(postId, commentId);
    handleSuccess(res, { message: '评论删除成功' });
  } catch (error) {
    next(error);
  }
};