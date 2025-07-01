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
    
    // 插入测试商品
    const testProducts = [
      {
        title: 'iPhone 15 Pro Max 256GB 深空黑色',
        desc: 'A17 Pro芯片，钛金属设计，4800万像素主摄',
        img: 'https://via.placeholder.com/300x300?text=iPhone15',
        current_price: 9999.00,
        original_price: 10999.00,
        is_hot: 1,
        is_drop: 1,
        category: '手机数码',
        brand: 'Apple'
      },
      {
        title: 'MacBook Pro 14英寸 M3芯片 16GB+512GB',
        desc: 'M3芯片，14英寸Liquid视网膜XDR显示屏',
        img: 'https://via.placeholder.com/300x300?text=MacBook',
        current_price: 14999.00,
        original_price: 15999.00,
        is_hot: 1,
        is_drop: 0,
        category: '电脑办公',
        brand: 'Apple'
      },
      {
        title: '华为 Mate 60 Pro 12GB+512GB 雅川青',
        desc: '麒麟9000S芯片，昆仑玻璃，卫星通信',
        img: 'https://via.placeholder.com/300x300?text=Huawei',
        current_price: 6999.00,
        original_price: 6999.00,
        is_hot: 1,
        is_drop: 0,
        category: '手机数码',
        brand: 'Huawei'
      },
      {
        title: '小米14 Ultra 16GB+1TB 钛金属黑',
        desc: '骁龙8 Gen 3，徕卡光学，2K屏幕',
        img: 'https://via.placeholder.com/300x300?text=Xiaomi',
        current_price: 6499.00,
        original_price: 6999.00,
        is_hot: 0,
        is_drop: 1,
        category: '手机数码',
        brand: 'Xiaomi'
      },
      {
        title: '索尼 WH-1000XM5 无线降噪耳机',
        desc: '30小时续航，LDAC编码，多点连接',
        img: 'https://via.placeholder.com/300x300?text=Sony',
        current_price: 2499.00,
        original_price: 2999.00,
        is_hot: 0,
        is_drop: 1,
        category: '音频设备',
        brand: 'Sony'
      }
    ];
    
    for (const product of testProducts) {
      await pool.execute(
        'INSERT INTO products (title, `desc`, img, current_price, original_price, is_hot, is_drop, category, brand) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [product.title, product.desc, product.img, product.current_price, product.original_price, product.is_hot, product.is_drop, product.category, product.brand]
      );
    }
    
    // 插入商品价格历史数据
    const platforms = ['京东', '天猫', '拼多多', '苏宁'];
    const today = new Date();
    
    for (let productId = 1; productId <= 5; productId++) {
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        for (const platform of platforms) {
          // 生成随机价格，模拟价格波动
          const basePrice = 1000 + productId * 1000;
          const variation = (Math.random() - 0.5) * 0.1; // ±5% 波动
          const price = basePrice * (1 + variation);
          
          await pool.execute(
            'INSERT INTO product_prices (product_id, platform, price, date) VALUES (?, ?, ?, ?)',
            [productId, platform, price.toFixed(2), dateStr]
          );
        }
      }
    }
    
    // 插入测试收藏数据
    const testFavorites = [
      { user_id: 1, product_id: 1, alert_price: 9500.00 },
      { user_id: 1, product_id: 3, alert_price: 6500.00 },
      { user_id: 2, product_id: 2, alert_price: 14000.00 },
      { user_id: 2, product_id: 5, alert_price: 2000.00 }
    ];
    
    for (const favorite of testFavorites) {
      await pool.execute(
        'INSERT INTO favorites (user_id, product_id, alert_price) VALUES (?, ?, ?)',
        [favorite.user_id, favorite.product_id, favorite.alert_price]
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