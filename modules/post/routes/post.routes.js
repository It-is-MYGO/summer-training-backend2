const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const auth = require('../../../lib/middleware/auth');

// 动态相关路由
// GET /api/posts - 获取动态列表
router.get('/', postController.getPosts);

// GET /api/posts/recommend - 获取推荐动态
router.get('/recommend', postController.getRecommendPosts);

// GET /api/posts/tags - 获取标签列表
router.get('/tags', postController.getTags);

// GET /api/posts/user/:userId - 获取用户个人动态
router.get('/user/:userId', postController.getUserPosts);

// GET /api/posts/:id - 获取动态详情
router.get('/:id', postController.getPostById);

// POST /api/posts - 创建动态
router.post('/', auth, postController.createPost);

// PUT /api/posts/:id - 更新动态
router.put('/:id', auth, postController.updatePost);

// DELETE /api/posts/:id - 删除动态
router.delete('/:id', auth, postController.deletePost);

// DELETE /api/posts/user/:userId/all - 删除用户所有动态
router.delete('/user/:userId/all', auth, postController.deleteAllUserPosts);

// POST /api/posts/:id/like - 点赞/取消点赞
router.post('/:id/like', auth, postController.toggleLike);

// POST /api/posts/:id/collect - 收藏/取消收藏
router.post('/:id/collect', auth, postController.toggleCollect);

// POST /api/posts/:id/comments - 添加评论
router.post('/:id/comments', auth, postController.addComment);

// GET /api/posts/:id/comments - 获取动态评论列表
router.get('/:id/comments', postController.getComments);

// GET /api/posts/collections/user/:userId - 获取用户收藏的动态列表
router.get('/collections/user/:userId', auth, postController.getUserCollections);

// DELETE /api/posts/:postId/comments/:commentId - 删除评论
router.delete('/:postId/comments/:commentId', auth, postController.deleteComment);

module.exports = router; 