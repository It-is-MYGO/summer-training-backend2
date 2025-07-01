const fetch = require('node-fetch');

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
        console.log('现在前端可以正确跳转到商品详情页面了');
        
        // 测试商品详情API
        console.log('\n🔍 测试商品详情API...');
        const productResponse = await fetch(`http://localhost:3000/api/products/${firstItem.product_id}`);
        if (productResponse.ok) {
          const product = await productResponse.json();
          console.log('✅ 商品详情API正常，商品标题:', product.title);
          console.log('✅ 建议前端使用路由: /product/' + firstItem.product_id);
        } else {
          console.log('❌ 商品详情API失败，状态码:', productResponse.status);
        }
      } else {
        console.log('\n❌ 修复失败！product_id字段仍然缺失');
      }
    } else {
      console.log('\n⚠️ 没有收藏数据，请先添加一些收藏');
    }
  } catch (error) {
    console.error('测试失败:', error.message);
    console.log('请确保后端服务正在运行 (npm start)');
  }
}

testFavoritesAPI(); 