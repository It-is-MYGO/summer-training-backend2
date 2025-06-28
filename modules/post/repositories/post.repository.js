const { pool } = require('../../../lib/database/connection');
const Post = require('../models/post');

class PostRepository {
  // 创建动态
  async create(postData) {
    const { content, images, userId, timestamp, tags, location, visibility, product } = postData;
    
    const query = `
      INSERT INTO posts (content, images, userId, time, tags, location, visibility, product, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const values = [
      content,
      JSON.stringify(images || []),
      userId,
      toMySQLDateTime(timestamp ?? null),
      JSON.stringify(tags || []),
      location ?? null,
      visibility ?? 'public',
      product ? JSON.stringify(product) : null
    ];

    try {
      const [result] = await pool.execute(query, values);
      return result.insertId;
    } catch (error) {
      throw new Error(`创建动态失败: ${error.message}`);
    }
  }

  // 更新动态
  async update(id, updateData) {
    const { content, images, tags, location, visibility, product } = updateData;
    
    const query = `
      UPDATE posts 
      SET content = ?, images = ?, tags = ?, location = ?, visibility = ?, product = ?, updatedAt = NOW()
      WHERE id = ?
    `;
    
    const values = [
      content,
      JSON.stringify(images || []),
      JSON.stringify(tags || []),
      location || null,
      visibility || 'public',
      product ? JSON.stringify(product) : null,
      id
    ];

    try {
      const [result] = await pool.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`更新动态失败: ${error.message}`);
    }
  }

  // 获取动态详情
  async findById(id, currentUserId = null) {
    const query = `
      SELECT 
        p.*,
        u.username,
        u.avatar as userAvatar,
        (SELECT COUNT(*) FROM post_likes WHERE postId = p.id) as likes,
        (SELECT COUNT(*) FROM post_comments WHERE postId = p.id) as comments,
        ${currentUserId ? '(SELECT COUNT(*) FROM post_likes WHERE postId = p.id AND userId = ?) as isLiked,' : '0 as isLiked,'}
        ${currentUserId ? '(SELECT COUNT(*) FROM post_collections WHERE postId = p.id AND userId = ?) as isCollected,' : '0 as isCollected,'}
        ${currentUserId ? '(p.userId = ? OR EXISTS(SELECT 1 FROM users WHERE id = ? AND isadmin = 1)) as canEdit,' : '0 as canEdit,'}
        ${currentUserId ? '(p.userId = ? OR EXISTS(SELECT 1 FROM users WHERE id = ? AND isadmin = 1)) as canDelete' : '0 as canDelete'}
      FROM posts p
      LEFT JOIN users u ON p.userId = u.id
      WHERE p.id = ?
    `;

    const values = currentUserId ? 
      [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, id] :
      [id];

    try {
      const [rows] = await pool.execute(query, values);
      if (rows.length === 0) {
        return null;
      }
      
      const row = rows[0];
      row.isLiked = row.isLiked > 0;
      row.isCollected = row.isCollected > 0;
      row.canEdit = row.canEdit > 0;
      row.canDelete = row.canDelete > 0;
      
      return Post.fromDatabase(row);
    } catch (error) {
      throw new Error(`获取动态详情失败: ${error.message}`);
    }
  }

  // 获取动态列表
  async findAll(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      keyword = '',
      tag = '',
      sort = 'latest',
      currentUserId = null
    } = options;

    let whereClause = 'WHERE p.visibility = "public"';
    let whereParams = [];

    if (keyword) {
      whereClause += ' AND (p.content LIKE ? OR u.username LIKE ?)';
      whereParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (tag) {
      whereClause += ' AND JSON_CONTAINS(p.tags, ?)';
      whereParams.push(`"${tag}"`);
    }

    let orderClause = 'ORDER BY p.createdAt DESC';
    if (sort === 'popular') {
      orderClause = 'ORDER BY likes DESC, p.createdAt DESC';
    } else if (sort === 'oldest') {
      orderClause = 'ORDER BY p.createdAt ASC';
    }

    const offset = (page - 1) * pageSize;

    let selectFields = [
      'p.*',
      'u.username',
      'u.avatar as userAvatar',
      '(SELECT COUNT(*) FROM post_likes WHERE postId = p.id) as likes',
      '(SELECT COUNT(*) FROM post_comments WHERE postId = p.id) as comments'
    ];
    let selectParams = [];
    if (currentUserId) {
      selectFields.push(
        '(SELECT COUNT(*) FROM post_likes WHERE postId = p.id AND userId = ?) as isLiked',
        '(SELECT COUNT(*) FROM post_collections WHERE postId = p.id AND userId = ?) as isCollected',
        '(p.userId = ? OR EXISTS(SELECT 1 FROM users WHERE id = ? AND isadmin = 1)) as canEdit',
        '(p.userId = ? OR EXISTS(SELECT 1 FROM users WHERE id = ? AND isadmin = 1)) as canDelete'
      );
      selectParams.push(
        currentUserId, currentUserId,
        currentUserId, currentUserId,
        currentUserId, currentUserId
      );
    } else {
      selectFields.push(
        '0 as isLiked',
        '0 as isCollected',
        '0 as canEdit',
        '0 as canDelete'
      );
    }

    const pageSizeNum = Number(pageSize);
    const offsetNum = Number(offset);
    const finalParams = [...whereParams, ...selectParams];

    const query = `
      SELECT
        ${selectFields.join(',\n')}
      FROM posts p
      LEFT JOIN users u ON p.userId = u.id
      ${whereClause}
      ${orderClause}
      LIMIT ${pageSizeNum} OFFSET ${offsetNum}
    `;
    
    try {
      const [rows] = await pool.execute(query, finalParams);
      // 获取总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM posts p
        LEFT JOIN users u ON p.userId = u.id
        ${whereClause}
      `;
      const [countRows] = await pool.execute(countQuery, whereParams);
      const total = countRows[0].total;

      const posts = rows.map(row => {
        row.isLiked = row.isLiked > 0;
        row.isCollected = row.isCollected > 0;
        row.canEdit = row.canEdit > 0;
        row.canDelete = row.canDelete > 0;
        return Post.fromDatabase(row);
      });

      return {
        list: posts,
        total,
        page,
        pageSize
      };
    } catch (error) {
      throw new Error(`获取动态列表失败: ${error.message}`);
    }
  }

  // 删除动态
  async delete(id, userId) {
    const query = `
      DELETE FROM posts 
      WHERE id = ? AND (userId = ? OR EXISTS(SELECT 1 FROM users WHERE id = ? AND isadmin = 1))
    `;

    try {
      const [result] = await pool.execute(query, [id, userId, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`删除动态失败: ${error.message}`);
    }
  }

  // 删除用户所有动态
  async deleteAllUserPosts(targetUserId, currentUserId) {
    const query = `
      DELETE FROM posts 
      WHERE userId = ? AND (userId = ? OR EXISTS(SELECT 1 FROM users WHERE id = ? AND isadmin = 1))
    `;

    try {
      const [result] = await pool.execute(query, [targetUserId, currentUserId, currentUserId]);
      return result.affectedRows;
    } catch (error) {
      throw new Error(`删除用户所有动态失败: ${error.message}`);
    }
  }

  // 点赞/取消点赞
  async toggleLike(postId, userId, like) {
    if (like) {
      const query = `
        INSERT IGNORE INTO post_likes (postId, userId, createdAt)
        VALUES (?, ?, NOW())
      `;
      await pool.execute(query, [postId, userId]);
    } else {
      const query = `
        DELETE FROM post_likes 
        WHERE postId = ? AND userId = ?
      `;
      await pool.execute(query, [postId, userId]);
    }

    // 获取最新点赞数
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as likes FROM post_likes WHERE postId = ?',
      [postId]
    );

    // 检查当前用户是否点赞
    const [likeRows] = await pool.execute(
      'SELECT COUNT(*) as isLiked FROM post_likes WHERE postId = ? AND userId = ?',
      [postId, userId]
    );

    return {
      likes: rows[0].likes,
      isLiked: likeRows[0].isLiked > 0
    };
  }

  // 收藏/取消收藏
  async toggleCollect(postId, userId, collect) {
    if (collect) {
      const query = `
        INSERT IGNORE INTO post_collections (postId, userId, createdAt)
        VALUES (?, ?, NOW())
      `;
      await pool.execute(query, [postId, userId]);
    } else {
      const query = `
        DELETE FROM post_collections 
        WHERE postId = ? AND userId = ?
      `;
      await pool.execute(query, [postId, userId]);
    }

    // 检查当前用户是否收藏
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as isCollected FROM post_collections WHERE postId = ? AND userId = ?',
      [postId, userId]
    );

    return {
      isCollected: rows[0].isCollected > 0
    };
  }

  // 添加评论
  async addComment(postId, userId, content) {
    const query = `
      INSERT INTO post_comments (postId, userId, content, createdAt)
      VALUES (?, ?, ?, NOW())
    `;

    try {
      const [result] = await pool.execute(query, [postId, userId, content]);
      
      // 获取评论详情
      const commentQuery = `
        SELECT 
          c.*,
          u.username,
          u.avatar as userAvatar
        FROM post_comments c
        LEFT JOIN users u ON c.userId = u.id
        WHERE c.id = ?
      `;
      
      const [commentRows] = await pool.execute(commentQuery, [result.insertId]);
      return commentRows[0];
    } catch (error) {
      throw new Error(`添加评论失败: ${error.message}`);
    }
  }

  // 删除评论
  async deleteComment(commentId, userId) {
    const query = `
      DELETE FROM post_comments 
      WHERE id = ? AND (userId = ? OR EXISTS(SELECT 1 FROM users WHERE id = ? AND isadmin = 1))
    `;

    try {
      const [result] = await pool.execute(query, [commentId, userId, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`删除评论失败: ${error.message}`);
    }
  }

  // 获取动态评论列表
  async getComments(postId, options = {}) {
    const {
      page = 1,
      pageSize = 20,
      sort = 'latest'
    } = options;

    let orderClause = 'ORDER BY c.createdAt DESC';
    if (sort === 'oldest') {
      orderClause = 'ORDER BY c.createdAt ASC';
    }

    const offset = (page - 1) * pageSize;
    const pageSizeNum = Number(pageSize);
    const offsetNum = Number(offset);

    const query = `
      SELECT 
        c.*,
        u.username,
        u.avatar as userAvatar
      FROM post_comments c
      LEFT JOIN users u ON c.userId = u.id
      WHERE c.postId = ?
      ${orderClause}
      LIMIT ${pageSizeNum} OFFSET ${offsetNum}
    `;

    try {
      const [rows] = await pool.execute(query, [postId]);
      
      // 获取总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM post_comments
        WHERE postId = ?
      `;
      const [countRows] = await pool.execute(countQuery, [postId]);
      const total = countRows[0].total;

      return {
        list: rows,
        total,
        page,
        pageSize
      };
    } catch (error) {
      throw new Error(`获取评论列表失败: ${error.message}`);
    }
  }

  // 获取用户收藏的动态列表
  async getUserCollections(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      sort = 'latest',
      userId
    } = options;

    let orderClause = 'ORDER BY pc.createdAt DESC';
    if (sort === 'oldest') {
      orderClause = 'ORDER BY pc.createdAt ASC';
    } else if (sort === 'popular') {
      orderClause = 'ORDER BY likes DESC, pc.createdAt DESC';
    }

    const offset = (page - 1) * pageSize;
    const pageSizeNum = Number(pageSize);
    const offsetNum = Number(offset);

    const query = `
      SELECT 
        p.*,
        u.username,
        u.avatar as userAvatar,
        (SELECT COUNT(*) FROM post_likes WHERE postId = p.id) as likes,
        (SELECT COUNT(*) FROM post_comments WHERE postId = p.id) as comments,
        (SELECT COUNT(*) FROM post_likes WHERE postId = p.id AND userId = ?) as isLiked,
        (SELECT COUNT(*) FROM post_collections WHERE postId = p.id AND userId = ?) as isCollected,
        (p.userId = ? OR EXISTS(SELECT 1 FROM users WHERE id = ? AND isadmin = 1)) as canEdit,
        (p.userId = ? OR EXISTS(SELECT 1 FROM users WHERE id = ? AND isadmin = 1)) as canDelete,
        pc.createdAt as collectedAt
      FROM post_collections pc
      LEFT JOIN posts p ON pc.postId = p.id
      LEFT JOIN users u ON p.userId = u.id
      WHERE pc.userId = ?
      ${orderClause}
      LIMIT ${pageSizeNum} OFFSET ${offsetNum}
    `;

    try {
      const [rows] = await pool.execute(query, [
        userId, userId, userId, userId, userId, userId, userId
      ]);
      
      // 获取总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM post_collections pc
        LEFT JOIN posts p ON pc.postId = p.id
        WHERE pc.userId = ?
      `;
      const [countRows] = await pool.execute(countQuery, [userId]);
      const total = countRows[0].total;

      const posts = rows.map(row => {
        row.isLiked = row.isLiked > 0;
        row.isCollected = row.isCollected > 0;
        row.canEdit = row.canEdit > 0;
        row.canDelete = row.canDelete > 0;
        return Post.fromDatabase(row);
      });

      return {
        list: posts,
        total,
        page,
        pageSize
      };
    } catch (error) {
      throw new Error(`获取用户收藏动态失败: ${error.message}`);
    }
  }

  // 获取标签列表
  async getTags() {
    const query = `
      SELECT DISTINCT JSON_UNQUOTE(JSON_EXTRACT(tags, '$[*]')) as tag
      FROM posts
      WHERE tags IS NOT NULL AND tags != '[]'
    `;

    try {
      const [rows] = await pool.execute(query);
      const tags = [];
      rows.forEach(row => {
        if (row.tag) {
          tags.push(row.tag);
        }
      });
      return [...new Set(tags)]; // 去重
    } catch (error) {
      throw new Error(`获取标签列表失败: ${error.message}`);
    }
  }

  // 获取用户个人动态
  async findUserPosts(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      sort = 'latest',
      targetUserId,
      currentUserId = null
    } = options;

    let whereClause = 'WHERE p.userId = ?';
    let whereParams = [targetUserId];

    let orderClause = 'ORDER BY p.createdAt DESC';
    if (sort === 'popular') {
      orderClause = 'ORDER BY likes DESC, p.createdAt DESC';
    } else if (sort === 'oldest') {
      orderClause = 'ORDER BY p.createdAt ASC';
    }

    const offset = (page - 1) * pageSize;

    let selectFields = [
      'p.*',
      'u.username',
      'u.avatar as userAvatar',
      '(SELECT COUNT(*) FROM post_likes WHERE postId = p.id) as likes',
      '(SELECT COUNT(*) FROM post_comments WHERE postId = p.id) as comments'
    ];
    let selectParams = [];
    
    if (currentUserId) {
      selectFields.push(
        '(SELECT COUNT(*) FROM post_likes WHERE postId = p.id AND userId = ?) as isLiked',
        '(SELECT COUNT(*) FROM post_collections WHERE postId = p.id AND userId = ?) as isCollected',
        '(p.userId = ? OR EXISTS(SELECT 1 FROM users WHERE id = ? AND isadmin = 1)) as canEdit',
        '(p.userId = ? OR EXISTS(SELECT 1 FROM users WHERE id = ? AND isadmin = 1)) as canDelete'
      );
      selectParams.push(
        currentUserId, currentUserId,
        currentUserId, currentUserId,
        currentUserId, currentUserId
      );
    } else {
      selectFields.push(
        '0 as isLiked',
        '0 as isCollected',
        '0 as canEdit',
        '0 as canDelete'
      );
    }

    const pageSizeNum = Number(pageSize);
    const offsetNum = Number(offset);
    const finalParams = [...whereParams, ...selectParams];

    const query = `
      SELECT
        ${selectFields.join(',\n')}
      FROM posts p
      LEFT JOIN users u ON p.userId = u.id
      ${whereClause}
      ${orderClause}
      LIMIT ${pageSizeNum} OFFSET ${offsetNum}
    `;
    
    try {
      const [rows] = await pool.execute(query, finalParams);
      
      // 获取总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM posts p
        LEFT JOIN users u ON p.userId = u.id
        ${whereClause}
      `;
      const [countRows] = await pool.execute(countQuery, whereParams);
      const total = countRows[0].total;

      const posts = rows.map(row => {
        row.isLiked = row.isLiked > 0;
        row.isCollected = row.isCollected > 0;
        row.canEdit = row.canEdit > 0;
        row.canDelete = row.canDelete > 0;
        return Post.fromDatabase(row);
      });

      return {
        list: posts,
        total,
        page,
        pageSize
      };
    } catch (error) {
      throw new Error(`获取用户动态失败: ${error.message}`);
    }
  }
}

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

module.exports = new PostRepository(); 