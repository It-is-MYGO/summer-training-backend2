const { pool } = require('../../../lib/database/connection');

// 获取用户收藏的商品
async function getUserProducts(userId) {
  const [rows] = await pool.query(
    `SELECT product_id FROM favorites WHERE user_id = ?`, [userId]);
  return rows.map(r => r.product_id);
}

// 基于物品的协同过滤
async function itemCF(userId) {
  const userProducts = await getUserProducts(userId);
  if (userProducts.length === 0) return [];
  const [otherUsers] = await pool.query(
    `SELECT DISTINCT user_id FROM favorites WHERE product_id IN (?) AND user_id != ?`, [userProducts, userId]);
  if (otherUsers.length === 0) return [];
  const otherUserIds = otherUsers.map(u => u.user_id);
  const [recommendProducts] = await pool.query(
    `SELECT product_id, COUNT(*) as score FROM favorites WHERE user_id IN (?) AND product_id NOT IN (?) GROUP BY product_id ORDER BY score DESC LIMIT 10`,
    [otherUserIds, userProducts]
  );
  return recommendProducts;
}

// 内容过滤
async function contentBased(userId) {
  const [brands] = await pool.query(
    `SELECT p.brand_id, COUNT(*) as cnt FROM favorites f JOIN products p ON f.product_id = p.id WHERE f.user_id = ? GROUP BY p.brand_id ORDER BY cnt DESC LIMIT 1`, [userId]);
  if (brands.length === 0) return [];
  const topBrandId = brands[0].brand_id;
  const [products] = await pool.query(
    `SELECT p.*, 
            (SELECT MIN(pp.price) FROM product_prices pp WHERE pp.product_id = p.id) as price,
            (SELECT JSON_ARRAYAGG(pp.platform) FROM product_prices pp WHERE pp.product_id = p.id) as platforms
     FROM products p 
     WHERE p.brand_id = ? 
     LIMIT 10`, [topBrandId]);
  const finalProducts = products.map(product => ({
    ...product,
    price: product.price || '¥价格待定',
    platforms: product.platforms && product.platforms.length > 0 ? product.platforms : ['京东', '天猫', '苏宁']
  }));
  return finalProducts;
}

// 混合推荐
async function hybridRecommend(userId) {
  const itemCfList = await itemCF(userId);
  const contentList = await contentBased(userId);
  const map = new Map();
  itemCfList.forEach(p => {
    map.set(p.product_id, p);
  });
  contentList.forEach(p => {
    map.set(p.id, p);
  });
  let result = Array.from(map.values()).slice(0, 10);
  if (result.length === 0) {
    try {
      const [hotProducts] = await pool.query(
        `SELECT p.*, 
                (SELECT MIN(pp.price) FROM product_prices pp WHERE pp.product_id = p.id) as price,
                (SELECT JSON_ARRAYAGG(pp.platform) FROM product_prices pp WHERE pp.product_id = p.id) as platforms
         FROM products p 
         ORDER BY RAND() 
         LIMIT 10`
      );
      const finalHotProducts = hotProducts.map(product => ({
        ...product,
        price: product.price || '¥价格待定',
        platforms: product.platforms && product.platforms.length > 0 ? product.platforms : ['京东', '天猫', '苏宁']
      }));
      result = finalHotProducts;
    } catch (error) {}
  }
  return result;
}

module.exports = {
  itemCF,
  contentBased,
  hybridRecommend,
};
