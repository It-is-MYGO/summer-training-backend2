const { pool } = require('./lib/database/connection');
const ProductPrice = require('./modules/price/models/price');

async function debugChartData() {
  try {
    console.log('=== 调试图表数据 ===');
    
    // 检查商品1的价格数据
    const productId = 1;
    
    console.log('\n1. 检查原始价格数据:');
    const [rawPrices] = await pool.query(
      'SELECT platform, price, date FROM product_prices WHERE product_id = ? ORDER BY platform, date ASC',
      [productId]
    );
    console.log('价格记录数量:', rawPrices.length);
    rawPrices.slice(0, 10).forEach(price => {
      console.log(`${price.platform}: ${price.price} (${price.date})`);
    });
    
    console.log('\n2. 测试findChartData方法:');
    try {
      const chartData = await ProductPrice.findChartData(productId);
      console.log('图表数据平台:', Object.keys(chartData));
      if (Object.keys(chartData).length > 0) {
        const firstPlatform = Object.keys(chartData)[0];
        console.log(`${firstPlatform} 数据点数量:`, chartData[firstPlatform].length);
        console.log(`${firstPlatform} 前3个数据点:`, chartData[firstPlatform].slice(0, 3));
      }
    } catch (error) {
      console.error('findChartData错误:', error.message);
    }
    
    console.log('\n3. 测试findMonthlyAverage方法:');
    try {
      const monthlyData = await ProductPrice.findMonthlyAverage(productId);
      console.log('月度数据数量:', monthlyData.length);
      if (monthlyData.length > 0) {
        console.log('前3个月度数据:', monthlyData.slice(0, 3));
      }
    } catch (error) {
      console.error('findMonthlyAverage错误:', error.message);
    }
    
    console.log('\n4. 检查是否有足够的历史数据:');
    const [dateRange] = await pool.query(
      'SELECT MIN(date) as min_date, MAX(date) as max_date FROM product_prices WHERE product_id = ?',
      [productId]
    );
    console.log('日期范围:', dateRange[0]);
    
    const [platformCount] = await pool.query(
      'SELECT platform, COUNT(*) as count FROM product_prices WHERE product_id = ? GROUP BY platform',
      [productId]
    );
    console.log('各平台数据量:', platformCount);
    
  } catch (error) {
    console.error('调试失败:', error);
  } finally {
    process.exit(0);
  }
}

debugChartData(); 