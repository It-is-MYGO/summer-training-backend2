const request = require('supertest');
const app = require('./app');
const fetch = require('node-fetch');

async function testFavorites() {
  try {
    console.log('=== 测试收藏夹功能 ===');
    
    const userId = 1; // 使用测试用户ID
    const productId = 1; // 使用测试商品ID
    
    console.log('\n1. 测试获取收藏列表:');
    const favoritesRes = await request(app)
      .get('/api/favorites')
      .query({ userId: userId });
    
    console.log('状态码:', favoritesRes.status);
    if (favoritesRes.status === 200) {
      console.log('收藏数量:', favoritesRes.body.length);
      if (favoritesRes.body.length > 0) {
        console.log('第一个收藏:', {
          id: favoritesRes.body[0].id,
          title: favoritesRes.body[0].title,
          price: favoritesRes.body[0].price
        });
      }
    } else {
      console.log('错误:', favoritesRes.body);
    }
    
    console.log('\n2. 测试检查收藏状态:');
    const checkRes = await request(app)
      .get('/api/favorites/check')
      .query({ userId: userId, productId: productId });
    
    console.log('状态码:', checkRes.status);
    if (checkRes.status === 200) {
      console.log('收藏状态:', checkRes.body);
    } else {
      console.log('错误:', checkRes.body);
    }
    
    console.log('\n3. 测试添加收藏:');
    const addRes = await request(app)
      .post('/api/favorites')
      .send({ userId: userId, productId: productId });
    
    console.log('状态码:', addRes.status);
    console.log('响应:', addRes.body);
    
    console.log('\n4. 再次检查收藏状态:');
    const checkRes2 = await request(app)
      .get('/api/favorites/check')
      .query({ userId: userId, productId: productId });
    
    console.log('状态码:', checkRes2.status);
    if (checkRes2.status === 200) {
      console.log('收藏状态:', checkRes2.body);
    } else {
      console.log('错误:', checkRes2.body);
    }
    
    console.log('\n5. 测试无用户ID的情况:');
    const noUserIdRes = await request(app)
      .get('/api/favorites');
    
    console.log('状态码:', noUserIdRes.status);
    console.log('错误信息:', noUserIdRes.body);
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    process.exit(0);
  }
}

async function testFavoritesAPI() {
  try {
    // 测试获取收藏夹列表
    const response = await fetch('http://localhost:3000/api/favorites?userId=1');
    const favorites = await response.json();
    
    console.log('收藏夹数据:');
    console.log(JSON.stringify(favorites, null, 2));
    
    // 检查是否包含product_id字段
    if (favorites.length > 0) {
      const firstItem = favorites[0];
      console.log('\n第一个收藏项:');
      console.log('id:', firstItem.id);
      console.log('product_id:', firstItem.product_id);
      console.log('title:', firstItem.title);
      
      if (firstItem.product_id) {
        console.log('\n✅ 修复成功！product_id字段已包含在返回数据中');
      } else {
        console.log('\n❌ 修复失败！product_id字段仍然缺失');
      }
    } else {
      console.log('\n⚠️ 没有收藏数据，请先添加一些收藏');
    }
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testFavorites();
testFavoritesAPI(); 