-- 动态表
CREATE TABLE IF NOT EXISTS posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  content TEXT NOT NULL COMMENT '动态内容',
  images JSON COMMENT '图片URL数组',
  userId INT NOT NULL COMMENT '发布者用户ID',
  time DATETIME NOT NULL COMMENT '发布时间',
  tags JSON COMMENT '标签数组',
  location VARCHAR(255) COMMENT '位置信息',
  visibility ENUM('public', 'private', 'friends') DEFAULT 'public' COMMENT '可见性设置',
  product JSON COMMENT '关联商品信息',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_userId (userId),
  INDEX idx_createdAt (createdAt),
  INDEX idx_visibility (visibility)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态表';

-- 动态点赞表
CREATE TABLE IF NOT EXISTS post_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  postId INT NOT NULL COMMENT '动态ID',
  userId INT NOT NULL COMMENT '用户ID',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_post_user (postId, userId),
  INDEX idx_postId (postId),
  INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态点赞表';

-- 动态收藏表
CREATE TABLE IF NOT EXISTS post_collections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  postId INT NOT NULL COMMENT '动态ID',
  userId INT NOT NULL COMMENT '用户ID',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_post_user (postId, userId),
  INDEX idx_postId (postId),
  INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态收藏表';

-- 动态评论表
CREATE TABLE IF NOT EXISTS post_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  postId INT NOT NULL COMMENT '动态ID',
  userId INT NOT NULL COMMENT '评论者用户ID',
  content TEXT NOT NULL COMMENT '评论内容',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_postId (postId),
  INDEX idx_userId (userId),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态评论表';

-- 确保users表存在（如果不存在则创建）
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(255) DEFAULT NULL,
  isadmin TINYINT(1) DEFAULT 0,
  status ENUM('active','banned') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表'; 