--测试冷启动，手动插入数据
INSERT INTO users (id, username, email, password, avatar, createdAt, updatedAt, isadmin, status, activity)
VALUES
(38, 'testuser38', 'test38@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0),
(39, 'testuser39', 'test39@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0),
(40, 'testuser40', 'test40@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0),
(41, 'testuser41', 'test41@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0),
(42, 'testuser42', 'test42@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0),
(43, 'testuser43', 'test43@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0),
(44, 'testuser44', 'test44@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0),
(45, 'testuser45', 'test45@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0),
(46, 'testuser46', 'test46@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0),
(47, 'testuser47', 'test47@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0),
(48, 'testuser48', 'test48@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0),
(49, 'testuser49', 'test49@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0),
(50, 'testuser50', 'test50@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0),
(51, 'testuser51', 'test51@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0),
(52, 'testuser52', 'test52@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0),
(53, 'testuser53', 'test53@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0),
(54, 'testuser54', 'test54@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0),
(55, 'testuser55', 'test55@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0),
(56, 'testuser56', 'test56@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0),
(57, 'testuser57', 'test57@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0);
INSERT INTO posts (content, images, userId, time, tags, location, visibility, product, status, createdAt, updatedAt)
VALUES (
  '这是一条用于冷启动测试的热门动态，欢迎大家点赞收藏评论！',
  '["https://via.placeholder.com/400x400?text=HotPost"]',
  38,
  NOW(),
  '["测试","热门"]',
  '测试城市',
  'public',
  NULL,
  'approved',
  NOW(),
  NOW()
);
INSERT INTO post_likes (postId, userId, createdAt)
VALUES
(38, 38, NOW()), (38, 39, NOW()), (38, 40, NOW()), (38, 41, NOW()), (38, 42, NOW()),
(38, 43, NOW()), (38, 44, NOW()), (38, 45, NOW()), (38, 46, NOW()), (38, 47, NOW()),
(38, 48, NOW()), (38, 49, NOW()), (38, 50, NOW()), (38, 51, NOW()), (38, 52, NOW()),
(38, 53, NOW()), (38, 54, NOW()), (38, 55, NOW()), (38, 56, NOW()), (38, 57, NOW());
INSERT INTO post_collections (postId, userId, createdAt)
VALUES
(38, 38, NOW()), (38, 39, NOW()), (38, 40, NOW()), (38, 41, NOW()), (38, 42, NOW()),
(38, 43, NOW()), (38, 44, NOW()), (38, 45, NOW()), (38, 46, NOW()), (38, 47, NOW()),
(38, 48, NOW()), (38, 49, NOW()), (38, 50, NOW()), (38, 51, NOW()), (38, 52, NOW()),
(38, 53, NOW()), (38, 54, NOW()), (38, 55, NOW()), (38, 56, NOW()), (38, 57, NOW());
INSERT INTO post_comments (postId, userId, content, createdAt)
VALUES
(38, 38, '评论测试1', NOW()), (38, 39, '评论测试2', NOW()), (38, 40, '评论测试3', NOW()), (38, 41, '评论测试4', NOW()), (38, 42, '评论测试5', NOW()),
(38, 43, '评论测试6', NOW()), (38, 44, '评论测试7', NOW()), (38, 45, '评论测试8', NOW()), (38, 46, '评论测试9', NOW()), (38, 47, '评论测试10', NOW()),
(38, 48, '评论测试11', NOW()), (38, 49, '评论测试12', NOW()), (38, 50, '评论测试13', NOW()), (38, 51, '评论测试14', NOW()), (38, 52, '评论测试15', NOW()),
(38, 53, '评论测试16', NOW()), (38, 54, '评论测试17', NOW()), (38, 55, '评论测试18', NOW()), (38, 56, '评论测试19', NOW()), (38, 57, '评论测试20', NOW());

--测试协同过滤，用户1，2为相似用户
INSERT INTO users (id, username, email, password, avatar, createdAt, updatedAt, isadmin, status, activity)
VALUES
(1, 'testuser1', 'test1@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0),
(2, 'testuser2', 'test2@example.com', '123456', NULL, NOW(), NOW(), 0, 'active', 0)
ON DUPLICATE KEY UPDATE username=VALUES(username);
INSERT INTO post_likes (postId, userId, createdAt) VALUES
(54, 1, NOW()), (55, 1, NOW()), (56, 1, NOW()),
(54, 2, NOW()), (55, 2, NOW()), (56, 2, NOW());
INSERT INTO post_collections (postId, userId, createdAt) VALUES
(54, 1, NOW()), (55, 1, NOW()), (56, 1, NOW()),
(54, 2, NOW()), (55, 2, NOW()), (56, 2, NOW());
INSERT INTO post_comments (postId, userId, content, createdAt) VALUES
(54, 1, '评论测试1', NOW()), (55, 1, '评论测试2', NOW()), (56, 1, '评论测试3', NOW()),
(54, 2, '评论测试4', NOW()), (55, 2, '评论测试5', NOW()), (56, 2, '评论测试6', NOW());
INSERT INTO post_likes (postId, userId, createdAt) VALUES (57, 2, NOW());
INSERT INTO post_collections (postId, userId, createdAt) VALUES (57, 2, NOW());
INSERT INTO post_comments (postId, userId, content, createdAt) VALUES (57, 2, '评论测试7', NOW());  