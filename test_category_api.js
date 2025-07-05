const axios = require('axios');

async function testCategoryAPI() {
  try {
    console.log('🧪 测试商品分类分布API...');
    
    // 测试API接口
    const response = await axios.get('http://localhost:3000/api/products/category-distribution');
    
    console.log('✅ API响应状态:', response.status);
    console.log('📊 响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.code === 0) {
      console.log('🎉 API测试成功！');
      
      // 显示分类统计
      const data = response.data.data;
      console.log('\n📈 分类分布统计:');
      data.forEach((item, index) => {
        console.log(`${index + 1}. ${item.category}: ${item.count} 件`);
      });
      
      // 计算总数
      const total = data.reduce((sum, item) => sum + item.count, 0);
      console.log(`\n总计: ${total} 件商品`);
      
    } else {
      console.log('❌ API返回错误:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
    if (error.response) {
      console.error('错误详情:', error.response.data);
    }
  }
}

// 运行测试
testCategoryAPI(); 