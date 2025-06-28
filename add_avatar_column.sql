-- 为users表添加avatar字段（兼容旧版本MySQL）
-- 方法1：直接添加字段（如果字段已存在会报错，可以忽略）
ALTER TABLE users ADD COLUMN avatar VARCHAR(255) DEFAULT NULL COMMENT '用户头像URL';

-- 如果上面的语句报错说字段已存在，则使用下面的语句检查字段是否存在
-- DESCRIBE users;

-- 方法2：如果字段已存在，可以先删除再添加（谨慎使用）
-- ALTER TABLE users DROP COLUMN avatar;
-- ALTER TABLE users ADD COLUMN avatar VARCHAR(255) DEFAULT NULL COMMENT '用户头像URL'; 