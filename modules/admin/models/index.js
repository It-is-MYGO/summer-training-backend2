const Post = require('./Post');
const Comment = require('./Comment');

// 动态与评论的一对多关系
Post.hasMany(Comment, {
  foreignKey: 'post_id',
  as: 'postComments'  // 修改关联别名
});

Comment.belongsTo(Post, {
  foreignKey: 'post_id',
  as: 'post'
});

// 导出所有模型（根据你的实际需要添加其他模型）
module.exports = {
  Post,
  Comment
  // 其他模型...
};