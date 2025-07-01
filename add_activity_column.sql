-- 为users表添加activity字段（兼容旧版本MySQL）
ALTER TABLE users ADD COLUMN activity INT DEFAULT 0 COMMENT '用户活跃度'; 