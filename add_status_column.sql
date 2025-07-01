-- 为products表添加status字段
ALTER TABLE products ADD COLUMN status TINYINT(1) DEFAULT 1 COMMENT '商品状态：1-上架，0-下架';

-- 更新现有商品的状态为1（上架）
UPDATE products SET status = 1 WHERE status IS NULL;