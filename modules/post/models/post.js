const { DataTypes } = require('sequelize');
const { pool } = require('../../../lib/database/connection');

// 由于项目使用mysql2而不是sequelize，我们定义Post的数据结构
class Post {
  constructor(data) {
    this.id = data.id;
    this.content = data.content;
    this.images = data.images ? JSON.parse(data.images) : [];
    this.userId = data.userId;
    this.username = data.username;
    this.userAvatar = data.userAvatar;
    this.time = data.time;
    this.updatedAt = data.updatedAt;
    this.likes = data.likes || 0;
    this.comments = data.comments || 0;
    this.shares = data.shares || 0;
    this.isLiked = data.isLiked || false;
    this.isCollected = data.isCollected || false;
    this.canEdit = data.canEdit || false;
    this.canDelete = data.canDelete || false;
    this.product = data.product ? JSON.parse(data.product) : null;
    this.tags = data.tags ? JSON.parse(data.tags) : [];
    this.location = data.location;
    this.visibility = data.visibility || 'public';
  }

  static fromDatabase(row) {
    return new Post(row);
  }

  toJSON() {
    return {
      id: this.id,
      content: this.content,
      images: this.images,
      userId: this.userId,
      username: this.username,
      userAvatar: this.userAvatar,
      time: this.time,
      updatedAt: this.updatedAt,
      likes: this.likes,
      comments: this.comments,
      shares: this.shares,
      isLiked: this.isLiked,
      isCollected: this.isCollected,
      canEdit: this.canEdit,
      canDelete: this.canDelete,
      product: this.product,
      tags: this.tags,
      location: this.location,
      visibility: this.visibility
    };
  }
}

module.exports = Post; 