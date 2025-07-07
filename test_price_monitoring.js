const axios = require('axios');

// 测试配置
const BASE_URL = 'http://localhost:3000';
const TEST_TOKEN = 'your-test-token-here'; // 需要替换为实际的测试token

// 测试价格趋势数据获取
async function testPriceTrends() {
  try {
    console.log('🔍 测试价格趋势数据获取...');
    
    const response = await axios.get(`${BASE_URL}/api/admin/price-trends`, {
      params: {
        days: 7,
        category: '手机'
      },
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    console.log('✅ 价格趋势数据获取成功');
    console.log('数据条数:', response.data.data?.length || 0);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('示例数据:', response.data.data[0]);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('❌ 价格趋势数据获取失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试AI价格分析
async function testAIAnalysis(priceData) {
  try {
    console.log('\n🤖 测试AI价格分析...');
    
    const response = await axios.post(`${BASE_URL}/api/admin/ai-price-analysis`, {
      priceData: priceData || [],
      category: '手机',
      timeRange: '7'
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ AI价格分析成功');
    console.log('洞察数量:', response.data.insights?.length || 0);
    
    if (response.data.insights && response.data.insights.length > 0) {
      console.log('示例洞察:', response.data.insights[0]);
    }
    
    return response.data.insights;
  } catch (error) {
    console.error('❌ AI价格分析失败:', error.response?.data || error.message);
    return null;
  }
}

// 模拟价格数据（用于测试）
function generateMockPriceData() {
  const mockData = [];
  const categories = ['手机', '电脑', '平板'];
  const platforms = ['京东', '天猫', '苏宁'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    
    const dayData = {
      date: dateStr,
      prices: []
    };
    
    categories.forEach(category => {
      platforms.forEach(platform => {
        dayData.prices.push({
          productId: Math.floor(Math.random() * 1000),
          productTitle: `${category}测试商品`,
          category: category,
          price: Math.random() * 1000 + 500, // 500-1500随机价格
          platform: platform,
          url: `https://example.com/product/${Math.floor(Math.random() * 1000)}`
        });
      });
    });
    
    mockData.push(dayData);
  }
  
  return mockData;
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始价格监控功能测试...\n');
  
  // 测试1: 获取真实数据
  let priceData = await testPriceTrends();
  
  // 如果真实数据获取失败，使用模拟数据
  if (!priceData || priceData.length === 0) {
    console.log('⚠️ 使用模拟数据进行测试...');
    priceData = generateMockPriceData();
  }
  
  // 测试2: AI分析
  await testAIAnalysis(priceData);
  
  console.log('\n🎉 测试完成！');
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testPriceTrends,
  testAIAnalysis,
  generateMockPriceData
}; 