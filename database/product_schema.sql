-- 商品表
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL COMMENT '商品标题',
  `desc` TEXT COMMENT '商品描述',
  image VARCHAR(500) COMMENT '商品图片URL',
  category VARCHAR(100) COMMENT '商品分类',
  brand VARCHAR(100) COMMENT '品牌',
  is_hot BOOLEAN DEFAULT FALSE COMMENT '是否热门商品',
  is_drop BOOLEAN DEFAULT FALSE COMMENT '是否降价商品',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_title (title),
  INDEX idx_category (category),
  INDEX idx_brand (brand),
  INDEX idx_is_hot (is_hot),
  INDEX idx_is_drop (is_drop)
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
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_platform (platform),
  INDEX idx_date (date),
  UNIQUE KEY unique_product_platform_date (product_id, platform, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品价格表'; 