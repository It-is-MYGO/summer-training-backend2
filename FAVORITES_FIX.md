# 收藏夹商品跳转问题修复

## 问题描述
点击收藏栏里的商品无法跳转到商品详情页面，跳转后显示空白页面。同时，设置提醒价格功能出现API路径错误。

## 问题原因
1. **主要问题**：在 `modules/product/repositories/favoriteRepository.js` 的 `findAll` 方法中，返回的数据缺少了 `product_id` 字段，但前端代码中使用了 `item.product_id` 来进行路由跳转。

2. **路由不一致问题**：首页使用 `/product/${id}` 路由，而收藏夹页面使用 `/detail/${id}` 路由，导致路由不匹配。

3. **API路径错误**：前端调用 `PUT /api/favorites/:id/alert`，但后端路由是 `PUT /api/favorites/:id/alert-price`。

## 修复方案

### 1. 后端修复 - 添加product_id字段
修改 `modules/product/repositories/favoriteRepository.js` 文件中的 `findAll` 方法：

```javascript
// 修改前
return rows.map(row => ({
  id: row.id,
  title: row.title,
  price: row.price,
  priceChange: parseFloat(row.price_change) || 0,
  alertPrice: parseFloat(row.alert_price) || 0,
  img: row.img
}));

// 修改后
return rows.map(row => ({
  id: row.id,
  product_id: row.product_id,  // 添加这个字段
  title: row.title,
  price: row.price,
  priceChange: parseFloat(row.price_change) || 0,
  alertPrice: parseFloat(row.alert_price) || 0,
  img: row.img
}));
```

### 2. 后端修复 - 添加兼容性路由
修改 `modules/product/routes/favoriteRoutes.js` 文件，添加兼容性路由：

```javascript
// 设置提醒价格
router.put('/:id/alert-price', favoriteController.setAlertPrice);

// 设置提醒价格（兼容旧版本）
router.put('/:id/alert', favoriteController.setAlertPrice);
```

### 3. 前端修复 - 统一路由路径
修改收藏夹页面的跳转函数，使其与首页保持一致：

```javascript
// 修改前
function goToProduct(productId) {
  console.log('跳转商品id:', productId)
  if (!productId) return
  router.push(`/detail/${productId}`)
}

// 修改后
function goToProduct(productId) {
  console.log('跳转商品id:', productId)
  if (!productId) return
  router.push(`/product/${productId}`)  // 改为与首页一致的路由
}
```

### 4. 前端代码确认
前端代码已经正确实现：

```html
<!-- 模板中的点击事件 -->
@click="goToProduct(item.product_id)"
```

### 5. 路由配置确认
后端路由配置正确：
- `GET /api/products/:id` - 获取商品详情
- `GET /api/favorites?userId=xxx` - 获取收藏列表
- `PUT /api/favorites/:id/alert-price` - 设置提醒价格（新路径）
- `PUT /api/favorites/:id/alert` - 设置提醒价格（兼容路径）

## 测试验证

### 1. 启动后端服务
```bash
npm start
```

### 2. 测试收藏夹API
```bash
node test_favorites_fix.js
```

### 3. 测试提醒价格API
```bash
node test_alert_fix.js
```

### 4. 预期结果
- 收藏夹API返回的数据中包含 `product_id` 字段
- 前端可以正确获取到商品ID并进行跳转
- 使用统一的路由路径 `/product/${id}`
- 提醒价格API支持新旧两种路径

## 修复效果
修复后，用户点击收藏夹中的商品时：
1. 前端获取到正确的 `product_id`
2. 调用 `router.push('/product/${productId}')` 跳转到商品详情页（与首页一致）
3. 商品详情页通过 `route.params.id` 获取商品ID
4. 调用 `/api/products/${id}` 获取商品详情数据
5. 正常显示商品详情页面
6. 设置提醒价格功能正常工作

## 注意事项
1. 确保用户已登录（userId存在）
2. 确保商品ID在数据库中存在
3. 确保前端路由配置正确（`/product/:id` 路由存在）
4. 统一使用 `/product/:id` 路由，避免路由不一致问题
5. 提醒价格API现在支持两种路径，确保向后兼容 