const { pool } = require('../../../lib/database/connection');

async function checkData() {
  try {
    // 检查商品数量
    const [productRows] = await pool.query('SELECT COUNT(*) as count FROM products');
    console.log('商品数量:', productRows[0].count);
    
    // 检查价格记录数量
    const [priceRows] = await pool.query('SELECT COUNT(*) as count FROM product_prices');
    console.log('价格记录数量:', priceRows[0].count);
    
    // 如果有商品，显示前几个商品
    if (productRows[0].count > 0) {
      const [products] = await pool.query('SELECT id, title, is_hot, is_drop FROM products LIMIT 5');
      console.log('商品列表:');
      products.forEach(product => {
        console.log(`ID: ${product.id}, 标题: ${product.title}, 热门: ${product.is_hot}, 降价: ${product.is_drop}`);
      });
      
      // 检查第一个商品的价格数据
      const firstProductId = products[0].id;
      const [prices] = await pool.query('SELECT platform, price, date FROM product_prices WHERE product_id = ? LIMIT 10', [firstProductId]);
      console.log(`商品 ${firstProductId} 的价格数据:`);
      prices.forEach(price => {
        console.log(`平台: ${price.platform}, 价格: ${price.price}, 日期: ${price.date}`);
      });
    }
    
  } catch (error) {
    console.error('检查数据失败:', error);
  } finally {
    process.exit(0);
  }
}

checkData(); 