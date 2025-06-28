const ProductPrice = require('./modules/price/models/price');
const Product = require('./modules/product/models/product');

async function testPriceChange() {
  try {
    console.log('=== 测试价格变化字段 ===');
    
    console.log('\n1. 测试calculatePriceChange方法:');
    const productId = 1;
    const priceChange = await ProductPrice.calculatePriceChange(productId);
    console.log('商品1的价格变化:', priceChange);
    
    console.log('\n2. 测试findHotProducts方法:');
    const hotProducts = await Product.findHotProducts();
    console.log('热门商品数量:', hotProducts.length);
    if (hotProducts.length > 0) {
      console.log('第一个热门商品:', {
        id: hotProducts[0].id,
        title: hotProducts[0].title,
        priceChange: hotProducts[0].priceChange
      });
    }
    
    console.log('\n3. 测试findDropProducts方法:');
    const dropProducts = await Product.findDropProducts();
    console.log('降价商品数量:', dropProducts.length);
    if (dropProducts.length > 0) {
      console.log('第一个降价商品:', {
        id: dropProducts[0].id,
        title: dropProducts[0].title,
        priceChange: dropProducts[0].priceChange
      });
    }
    
    console.log('\n4. 检查价格变化计算逻辑:');
    // 手动检查价格变化计算
    const [prices] = await require('./lib/database/connection').pool.query(
      'SELECT price, date FROM product_prices WHERE product_id = ? ORDER BY date DESC LIMIT 2',
      [productId]
    );
    if (prices.length >= 2) {
      const currentPrice = parseFloat(prices[0].price);
      const previousPrice = parseFloat(prices[1].price);
      const manualChange = ((currentPrice - previousPrice) / previousPrice) * 100;
      console.log('手动计算价格变化:', {
        currentPrice,
        previousPrice,
        change: currentPrice - previousPrice,
        changePercent: Math.round(manualChange * 100) / 100
      });
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    process.exit(0);
  }
}

testPriceChange(); 