const ProductPrice = require('../../price/models/price');

async function testChartFix() {
  try {
    console.log('=== 测试修复后的图表数据 ===');
    
    const productId = 1;
    
    console.log('\n1. 测试修复后的findChartData:');
    const chartData = await ProductPrice.findChartData(productId);
    console.log('图表数据平台:', Object.keys(chartData));
    
    if (Object.keys(chartData).length > 0) {
      const firstPlatform = Object.keys(chartData)[0];
      console.log(`${firstPlatform} 数据点数量:`, chartData[firstPlatform].length);
      console.log(`${firstPlatform} 前3个数据点:`, chartData[firstPlatform].slice(0, 3));
      
      // 检查日期格式
      const firstDataPoint = chartData[firstPlatform][0];
      console.log('日期格式检查:', {
        date: firstDataPoint.date,
        dateType: typeof firstDataPoint.date,
        isDateString: /^\d{4}-\d{2}-\d{2}$/.test(firstDataPoint.date)
      });
    }
    
    console.log('\n2. 测试修复后的findMonthlyAverage:');
    const monthlyData = await ProductPrice.findMonthlyAverage(productId);
    console.log('月度数据:', monthlyData);
    
    console.log('\n3. 模拟API响应:');
    const apiResponse = {
      platformData: chartData,
      monthlyData: monthlyData
    };
    console.log('API响应结构:', {
      hasPlatformData: !!apiResponse.platformData,
      platformCount: Object.keys(apiResponse.platformData || {}).length,
      hasMonthlyData: !!apiResponse.monthlyData,
      monthlyDataCount: apiResponse.monthlyData ? apiResponse.monthlyData.length : 0
    });
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    process.exit(0);
  }
}

testChartFix(); 