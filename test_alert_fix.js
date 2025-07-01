const fetch = require('node-fetch');

async function testAlertAPI() {
  try {
    console.log('=== 测试提醒价格API修复 ===');
    
    // 首先获取收藏列表
    const favoritesResponse = await fetch('http://localhost:3000/api/favorites?userId=1');
    const favorites = await favoritesResponse.json();
    
    if (favorites.length === 0) {
      console.log('⚠️ 没有收藏数据，无法测试提醒价格功能');
      return;
    }
    
    const favoriteId = favorites[0].id;
    const alertPrice = 2500;
    
    console.log(`\n1. 测试 PUT /api/favorites/${favoriteId}/alert-price (新路径)`);
    const response1 = await fetch(`http://localhost:3000/api/favorites/${favoriteId}/alert-price`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ alertPrice: alertPrice })
    });
    
    console.log('状态码:', response1.status);
    if (response1.ok) {
      const result1 = await response1.json();
      console.log('✅ 新路径成功:', result1);
    } else {
      console.log('❌ 新路径失败:', response1.statusText);
    }
    
    console.log(`\n2. 测试 PUT /api/favorites/${favoriteId}/alert (旧路径)`);
    const response2 = await fetch(`http://localhost:3000/api/favorites/${favoriteId}/alert`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ alertPrice: alertPrice + 100 })
    });
    
    console.log('状态码:', response2.status);
    if (response2.ok) {
      const result2 = await response2.json();
      console.log('✅ 旧路径成功:', result2);
    } else {
      console.log('❌ 旧路径失败:', response2.statusText);
    }
    
    console.log('\n3. 验证收藏数据更新');
    const updatedFavoritesResponse = await fetch('http://localhost:3000/api/favorites?userId=1');
    const updatedFavorites = await updatedFavoritesResponse.json();
    const updatedFavorite = updatedFavorites.find(f => f.id === favoriteId);
    
    if (updatedFavorite) {
      console.log('✅ 提醒价格已更新:', updatedFavorite.alertPrice);
    } else {
      console.log('❌ 无法找到更新的收藏数据');
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
    console.log('请确保后端服务正在运行 (npm start)');
  }
}

testAlertAPI(); 