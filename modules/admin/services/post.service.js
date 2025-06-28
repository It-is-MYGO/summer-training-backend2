const postRepository = require('../repositories/post.repository');

exports.getAllPosts = async (page, limit, search) => {
  const offset = (page - 1) * limit;
  return await postRepository.findAndCountAll(offset, limit, search);
};

exports.getPostById = async (id) => {
  return await postRepository.findByIdWithComments(id);
};

exports.deletePost = async (id) => {
  return await postRepository.delete(id);
};

exports.deleteComment = async (postId, commentId) => {
  return await postRepository.deleteComment(postId, commentId);
};