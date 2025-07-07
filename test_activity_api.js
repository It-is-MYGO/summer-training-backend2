const axios = require('axios');

async function testActivityAPI() {
  console.log('🧪 测试用户活跃度API...');
  
  try {
    // 测试不需要认证的API
    const response = await axios.get('http://localhost:3000/api/users/activity-distribution');
    
    console.log('✅ API响应:', response.data);
    
    if (response.data && response.data.success) {
      console.log('📊 活跃度数据:', response.data.data);
    } else {
      console.log('⚠️ API返回格式异常');
    }
    
  } catch (error) {
    console.error('❌ API测试失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('网络错误:', error.message);
    }
  }
}

// 运行测试
testActivityAPI(); 