-- recommend_posts.sql
-- 直接将 :userId 替换为 1 以便在 MySQL 命令行直接执行

WITH interacted_posts AS (
  SELECT pl.postId FROM post_likes pl WHERE pl.userId = 1
  UNION
  SELECT pc.postId FROM post_collections pc WHERE pc.userId = 1
  UNION
  SELECT pcm.postId FROM post_comments pcm WHERE pcm.userId = 1
),
user_scores AS (
  SELECT p.id AS postId,
         (COUNT(DISTINCT l.id) * 2 + COUNT(DISTINCT c.id) * 3 + COUNT(DISTINCT cm.id) * 1) AS score
  FROM posts p
  LEFT JOIN post_likes l ON l.postId = p.id AND l.userId = 1
  LEFT JOIN post_collections c ON c.postId = p.id AND c.userId = 1
  LEFT JOIN post_comments cm ON cm.postId = p.id AND cm.userId = 1
  GROUP BY p.id
  HAVING score > 0
),
other_scores AS (
  SELECT u.id AS userId, p.id AS postId,
         (COUNT(DISTINCT l.id) * 2 + COUNT(DISTINCT c.id) * 3 + COUNT(DISTINCT cm.id) * 1) AS score
  FROM users u
  JOIN posts p
  LEFT JOIN post_likes l ON l.postId = p.id AND l.userId = u.id
  LEFT JOIN post_collections c ON c.postId = p.id AND c.userId = u.id
  LEFT JOIN post_comments cm ON cm.postId = p.id AND cm.userId = u.id
  WHERE u.id != 1
  GROUP BY u.id, p.id
  HAVING score > 0
),
similarities AS (
  SELECT
    o.userId,
    SUM(u.score * o.score) AS similarity
  FROM other_scores o
  JOIN user_scores u ON u.postId = o.postId
  GROUP BY o.userId
  ORDER BY similarity DESC
  LIMIT 5
),
similar_user_posts AS (
  SELECT
    p.id AS postId,
    SUM(
      (CASE WHEN l.userId IS NOT NULL THEN 2 ELSE 0 END) +
      (CASE WHEN c.userId IS NOT NULL THEN 3 ELSE 0 END) +
      (CASE WHEN cm.userId IS NOT NULL THEN 1 ELSE 0 END)
    ) AS score
  FROM posts p
  LEFT JOIN post_likes l ON l.postId = p.id AND l.userId IN (SELECT s.userId FROM similarities s)
  LEFT JOIN post_collections c ON c.postId = p.id AND c.userId IN (SELECT s.userId FROM similarities s)
  LEFT JOIN post_comments cm ON cm.postId = p.id AND cm.userId IN (SELECT s.userId FROM similarities s)
  GROUP BY p.id
)
SELECT p.*,
  (SELECT COUNT(*) FROM post_likes WHERE postId = p.id) AS likes,
  (SELECT COUNT(*) FROM post_comments WHERE postId = p.id) AS comments,
  (SELECT COUNT(*) FROM post_collections WHERE postId = p.id) AS collections
FROM posts p
JOIN similar_user_posts sup ON sup.postId = p.id
LEFT JOIN interacted_posts ip ON ip.postId = p.id
WHERE ip.postId IS NULL
ORDER BY sup.score DESC
LIMIT 10;

-- 热门动态推荐（新用户冷启动用）
-- 用法：SELECT * FROM hot_posts LIMIT 10;

WITH hot_posts AS (
  SELECT p.*,
         (COALESCE(l.like_count,0)*2 + COALESCE(c.collect_count,0)*3 + COALESCE(cm.comment_count,0)*1) AS hot_score,
         (SELECT COUNT(*) FROM post_likes WHERE postId = p.id) AS likes,
         (SELECT COUNT(*) FROM post_comments WHERE postId = p.id) AS comments,
         (SELECT COUNT(*) FROM post_collections WHERE postId = p.id) AS collections
  FROM posts p
  LEFT JOIN (
    SELECT postId, COUNT(*) AS like_count
    FROM post_likes
    WHERE createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY postId
  ) l ON l.postId = p.id
  LEFT JOIN (
    SELECT postId, COUNT(*) AS collect_count
    FROM post_collections
    WHERE createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY postId
  ) c ON c.postId = p.id
  LEFT JOIN (
    SELECT postId, COUNT(*) AS comment_count
    FROM post_comments
    WHERE createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY postId
  ) cm ON cm.postId = p.id
  WHERE p.status = 'approved'
  ORDER BY hot_score DESC, p.createdAt DESC
)
SELECT * FROM hot_posts LIMIT 10;