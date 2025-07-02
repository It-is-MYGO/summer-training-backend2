const { DataTypes } = require('sequelize');
const { pool } = require('../../../lib/database/connection');

// 工具函数：将ISO时间字符串转为MySQL DATETIME格式
function toMySQLDateTime(date) {
  if (!date) return null;
  if (date instanceof Date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }
  const d = new Date(date);
  if (isNaN(d)) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

// 工具函数：将ISO时间字符串转为MySQL DATETIME格式
function safeParseJSON(str, fallback) {
  if (Array.isArray(str)) {
    return str;
  }
  
  if (!str) {
    return fallback;
  }
  
  if (typeof str === 'string') {
    try {
      return JSON.parse(str);
    } catch (e) {
      if (str.startsWith('http')) {
        return [str];
      }
      return fallback;
    }
  }
  
  return fallback;
}

// 由于项目使用mysql2而不是sequelize，我们定义Post的数据结构
class Post {
  constructor(data) {
    this.id = data.id;
    this.content = data.content;
    this.images = safeParseJSON(data.images, []);
    this.userId = data.userId;
    this.username = data.username;
    this.userAvatar = data.userAvatar;
    this.time = data.time;
    this.updatedAt = data.updatedAt;
    this.likes = data.likes || 0;
    this.comments = data.comments || 0;
    this.isLiked = data.isLiked || false;
    this.isCollected = data.isCollected || false;
    this.canEdit = data.canEdit || false;
    this.canDelete = data.canDelete || false;
    this.product = safeParseJSON(data.product, null);
    this.tags = safeParseJSON(data.tags, []);
    this.location = data.location;
    this.visibility = data.visibility || 'public';
    this.collectedAt = data.collectedAt || null;
    this.status = data.status;
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
      isLiked: this.isLiked,
      isCollected: this.isCollected,
      canEdit: this.canEdit,
      canDelete: this.canDelete,
      product: this.product,
      tags: this.tags,
      location: this.location,
      visibility: this.visibility,
      collectedAt: this.collectedAt,
      status: this.status
    };
  }
}

module.exports = Post; 