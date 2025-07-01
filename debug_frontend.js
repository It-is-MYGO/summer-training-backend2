const request = require('supertest');
const app = require('./app');

async function debugFrontend() {
  try {
    console.log('=== 前端调试 ===');
    
    const productId = 1;
    
    console.log('\n1. 检查价格历史数据格式:');
    const historyRes = await request(app).get(`/api/products/${productId}/price-history`);
    console.log('状态码:', historyRes.status);
    if (historyRes.status === 200) {
      console.log('数据数量:', historyRes.body.length);
      console.log('前3条数据:');
      historyRes.body.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. 日期: ${item.date}, 价格: ${item.price}, 平台: ${item.platform}`);
      });
      
      // 检查数据是否适合Chart.js
      const labels = historyRes.body.map(item => item.date);
      const data = historyRes.body.map(item => item.price);
      console.log('\nChart.js数据检查:');
      console.log('  labels数量:', labels.length);
      console.log('  data数量:', data.length);
      console.log('  labels示例:', labels.slice(0, 3));
      console.log('  data示例:', data.slice(0, 3));
      console.log('  数据类型检查:');
      console.log('    labels[0]类型:', typeof labels[0]);
      console.log('    data[0]类型:', typeof data[0]);
      console.log('    data[0]是否为数字:', !isNaN(data[0]));
    }
    
    console.log('\n2. 检查图表数据格式:');
    const chartRes = await request(app).get(`/api/products/${productId}/chart-data`);
    console.log('状态码:', chartRes.status);
    if (chartRes.status === 200) {
      const chartData = chartRes.body;
      console.log('图表数据结构:');
      console.log('  platformData:', Object.keys(chartData.platformData || {}));
      console.log('  monthlyData数量:', chartData.monthlyData ? chartData.monthlyData.length : 0);
      
      if (chartData.platformData && Object.keys(chartData.platformData).length > 0) {
        const firstPlatform = Object.keys(chartData.platformData)[0];
        const platformData = chartData.platformData[firstPlatform];
        console.log(`\n${firstPlatform}平台数据:`);
        console.log('  数据点数量:', platformData.length);
        console.log('  前3个数据点:');
        platformData.slice(0, 3).forEach((item, index) => {
          console.log(`    ${index + 1}. 日期: ${item.date}, 价格: ${item.price}`);
        });
        
        // 检查数据格式
        const labels = platformData.map(item => item.date);
        const data = platformData.map(item => item.price);
        console.log('\nChart.js数据检查:');
        console.log('  labels数量:', labels.length);
        console.log('  data数量:', data.length);
        console.log('  数据类型检查:');
        console.log('    labels[0]类型:', typeof labels[0]);
        console.log('    data[0]类型:', typeof data[0]);
        console.log('    data[0]是否为数字:', !isNaN(data[0]));
      }
    }
    
    console.log('\n3. 模拟前端Chart.js配置:');
    const mockChartConfig = {
      type: 'line',
      data: {
        labels: ['2025-06-01', '2025-06-02', '2025-06-03'],
        datasets: [{
          label: '价格走势 (元)',
          data: [3399, 3349, 3299],
          borderColor: '#4361ee',
          backgroundColor: 'rgba(67, 97, 238, 0.1)',
          borderWidth: 3,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { 
            beginAtZero: false, 
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
            ticks: { color: '#333' }
          },
          x: { 
            grid: { display: false },
            ticks: { color: '#333' }
          }
        }
      }
    };
    console.log('模拟配置:', JSON.stringify(mockChartConfig, null, 2));
    
  } catch (error) {
    console.error('调试失败:', error);
  } finally {
    process.exit(0);
  }
}

debugFrontend(); 