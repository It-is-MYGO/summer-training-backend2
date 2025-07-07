-- 检查users表是否有activity字段
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'summer_db' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'activity';

-- 如果没有activity字段，添加它
ALTER TABLE users ADD COLUMN IF NOT EXISTS activity INT DEFAULT 0 COMMENT '用户活跃度';

-- 为现有用户设置一些示例活跃度数据
UPDATE users SET activity = FLOOR(RAND() * 200) + 1 WHERE activity = 0 OR activity IS NULL;

-- 查看活跃度分布
SELECT
  SUM(CASE WHEN activity > 100 THEN 1 ELSE 0 END) AS high,
  SUM(CASE WHEN activity BETWEEN 51 AND 100 THEN 1 ELSE 0 END) AS medium,
  SUM(CASE WHEN activity BETWEEN 11 AND 50 THEN 1 ELSE 0 END) AS low,
  SUM(CASE WHEN activity <= 10 THEN 1 ELSE 0 END) AS new_user,
  COUNT(*) AS total_users
FROM users; 