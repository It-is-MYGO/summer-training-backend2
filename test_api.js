const request = require('supertest');
const app = require('./app');

async function testAPI() {
  try {
    console.log('测试获取所有商品接口...');
    const productsRes = await request(app).get('/api/products');
    console.log('状态码:', productsRes.status);
    console.log('商品数量:', productsRes.body.length);
    if (productsRes.body.length > 0) {
      console.log('第一个商品:', productsRes.body[0].title);
    }
    
    console.log('\n测试获取热门商品接口...');
    const hotRes = await request(app).get('/api/products/hot');
    console.log('状态码:', hotRes.status);
    console.log('热门商品数量:', hotRes.body.length);
    if (hotRes.body.length > 0) {
      console.log('第一个热门商品:', hotRes.body[0].title);
      console.log('价格变化:', hotRes.body[0].priceChange);
    }
    
    console.log('\n测试获取降价商品接口...');
    const dropRes = await request(app).get('/api/products/drops');
    console.log('状态码:', dropRes.status);
    console.log('降价商品数量:', dropRes.body.length);
    if (dropRes.body.length > 0) {
      console.log('第一个降价商品:', dropRes.body[0].title);
      console.log('价格变化:', dropRes.body[0].priceChange);
    }
    
    console.log('\n测试获取图表数据接口...');
    const chartRes = await request(app).get('/api/products/1/chart-data');
    console.log('状态码:', chartRes.status);
    if (chartRes.status === 200) {
      console.log('图表数据:', Object.keys(chartRes.body.platformData || {}));
    } else {
      console.log('图表数据错误:', chartRes.body);
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
  } finally {
    process.exit(0);
  }
}

testAPI(); 