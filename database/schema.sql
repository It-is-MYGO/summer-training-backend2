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
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '审核状态',
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

-- 动态分享表
CREATE TABLE IF NOT EXISTS post_shares (
  id INT PRIMARY KEY AUTO_INCREMENT,
  postId INT NOT NULL COMMENT '动态ID',
  userId INT NOT NULL COMMENT '分享者用户ID',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_postId (postId),
  INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态分享表';

-- 确保users表存在（如果不存在则创建）
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(255) DEFAULT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 商品表
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL COMMENT '商品标题',
  `desc` TEXT COMMENT '商品描述',
  img VARCHAR(500) COMMENT '商品图片URL',
  current_price DECIMAL(10,2) DEFAULT 0.00 COMMENT '当前价格',
  original_price DECIMAL(10,2) DEFAULT 0.00 COMMENT '原价',
  is_hot TINYINT(1) DEFAULT 0 COMMENT '是否热门商品',
  is_drop TINYINT(1) DEFAULT 0 COMMENT '是否降价商品',
  category VARCHAR(100) COMMENT '商品分类',
  brand VARCHAR(100) COMMENT '品牌',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_title (title),
  INDEX idx_is_hot (is_hot),
  INDEX idx_is_drop (is_drop),
  INDEX idx_category (category),
  INDEX idx_brand (brand)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';

-- 商品价格表
CREATE TABLE IF NOT EXISTS product_prices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL COMMENT '商品ID',
  platform VARCHAR(50) NOT NULL COMMENT '平台名称',
  price DECIMAL(10,2) NOT NULL COMMENT '价格',
  date DATE NOT NULL COMMENT '价格日期',
  url VARCHAR(500) COMMENT '商品链接',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_product_platform_date (product_id, platform, date),
  INDEX idx_product_id (product_id),
  INDEX idx_platform (platform),
  INDEX idx_date (date),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品价格表';

-- 收藏表
CREATE TABLE IF NOT EXISTS favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  product_id INT NOT NULL COMMENT '商品ID',
  alert_price DECIMAL(10,2) DEFAULT NULL COMMENT '提醒价格',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_product (user_id, product_id),
  INDEX idx_user_id (user_id),
  INDEX idx_product_id (product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏表'; 