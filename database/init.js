const fs = require('fs');
const path = require('path');
const { pool } = require('../lib/database/connection');

async function initDatabase() {
  try {
    console.log('开始初始化数据库...');
    
    // 读取SQL文件
    const sqlPath = path.join(__dirname, 'schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // 分割SQL语句
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // 执行每个SQL语句
    for (const statement of statements) {
      if (statement) {
        await pool.execute(statement);
        console.log('执行SQL:', statement.substring(0, 50) + '...');
      }
    }
    
    console.log('数据库初始化完成！');
    
    // 插入一些测试数据
    await insertTestData();
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
  } finally {
    process.exit(0);
  }
}

async function insertTestData() {
  try {
    console.log('插入测试数据...');
    
    // 检查是否已有测试用户
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
    if (users[0].count > 0) {
      console.log('已存在用户数据，跳过测试数据插入');
      return;
    }
    
    // 插入测试用户
    const testUsers = [
      {
        username: 'testuser1',
        email: 'test1@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        avatar: 'https://via.placeholder.com/150'
      },
      {
        username: 'testuser2',
        email: 'test2@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        avatar: 'https://via.placeholder.com/150'
      }
    ];
    
    for (const user of testUsers) {
      await pool.execute(
        'INSERT INTO users (username, email, password, avatar) VALUES (?, ?, ?, ?)',
        [user.username, user.email, user.password, user.avatar]
      );
    }
    
    // 插入测试动态
    const testPosts = [
      {
        content: '今天天气真好，适合出去走走！',
        images: JSON.stringify(['https://via.placeholder.com/300x200']),
        userId: 1,
        time: new Date().toISOString(),
        tags: JSON.stringify(['生活', '心情']),
        location: '武汉大学',
        visibility: 'public'
      },
      {
        content: '新买的手机到了，性能很棒！',
        images: JSON.stringify(['https://via.placeholder.com/300x200', 'https://via.placeholder.com/300x200']),
        userId: 2,
        time: new Date().toISOString(),
        tags: JSON.stringify(['数码', '手机']),
        location: '武汉',
        visibility: 'public',
        product: JSON.stringify({
          name: 'iPhone 15',
          price: '¥5999',
          image: 'https://via.placeholder.com/150',
          platform: '京东'
        })
      }
    ];
    
    for (const post of testPosts) {
      await pool.execute(
        'INSERT INTO posts (content, images, userId, time, tags, location, visibility, product) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [post.content, post.images, post.userId, post.time, post.tags, post.location, post.visibility, post.product]
      );
    }
    
    console.log('测试数据插入完成！');
    
  } catch (error) {
    console.error('插入测试数据失败:', error);
  }
}

// 运行初始化
initDatabase(); 