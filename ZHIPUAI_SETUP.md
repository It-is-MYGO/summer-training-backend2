# 智谱AI大模型接口接入指南

## 概述
本项目已集成智谱AI大模型接口，提供智能价格分析、市场趋势预测和个性化推荐功能。

## 功能特性

### 1. 智能价格分析
- 自动分析价格趋势和变化率
- 检测异常价格波动
- 提供市场动态评估
- 生成购买建议和风险提示

### 2. 市场趋势预测
- 基于历史数据预测未来价格趋势
- 分析市场供需变化
- 提供购买时机建议
- 风险评估和预警

### 3. 智能推荐系统
- 基于用户偏好生成个性化推荐
- 性价比分析和建议
- 风险规避策略
- 个性化购物策略

## 配置步骤

### 1. 获取智谱AI API密钥
1. 访问 [智谱AI官网](https://open.bigmodel.cn/)
2. 注册账号并完成实名认证
3. 创建应用获取API密钥
4. 选择合适的模型（推荐使用GLM-4）

### 2. 配置环境变量
在项目根目录创建 `.env` 文件：

```bash
# 智谱AI配置
ZHIPUAI_API_KEY=your_actual_api_key_here

# 其他配置...
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=summer_db
JWT_SECRET=your_jwt_secret
```

### 3. 安装依赖
```bash
npm install zhipuai
```

## API接口说明

### 1. 价格智能分析
```http
POST /api/admin/ai-price-analysis
Authorization: Bearer <token>
Content-Type: application/json

{
  "priceData": [...],
  "category": "手机",
  "timeRange": "7"
}
```

### 2. 市场趋势预测
```http
POST /api/admin/ai-market-prediction
Authorization: Bearer <token>
Content-Type: application/json

{
  "priceData": [...],
  "category": "手机"
}
```

### 3. 智能推荐
```http
POST /api/admin/ai-smart-recommendations
Authorization: Bearer <token>
Content-Type: application/json

{
  "priceData": [...],
  "userPreferences": {
    "budget": 5000,
    "preferredPlatforms": ["京东", "天猫"],
    "riskTolerance": "medium"
  }
}
```

### 4. AI配置检查
```http
GET /api/admin/ai-config-check
Authorization: Bearer <token>
```

## 前端使用

### 1. 在Charts.vue中使用
```javascript
// 检查AI配置
async checkAIConfig() {
  const response = await axios.get('/api/admin/ai-config-check', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
}

// 生成市场预测
async generateMarketPrediction() {
  const response = await axios.post('/api/admin/ai-market-prediction', {
    priceData: this.priceData,
    category: this.selectedCategory
  }, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
}
```

### 2. 价格分析自动集成
价格趋势图表会自动调用智谱AI进行分析，无需额外配置。

## 错误处理

### 1. API密钥错误
```
错误信息：Invalid API key
解决方案：检查ZHIPUAI_API_KEY环境变量是否正确设置
```

### 2. 网络连接错误
```
错误信息：Network error
解决方案：检查网络连接和防火墙设置
```

### 3. 模型调用失败
```
错误信息：Model not available
解决方案：检查模型名称是否正确，确认账户余额充足
```

## 性能优化

### 1. 缓存策略
- AI分析结果会缓存5分钟
- 相同参数的分析会直接返回缓存结果

### 2. 降级策略
- AI分析失败时自动回退到本地分析
- 确保系统稳定性和可用性

### 3. 并发控制
- 限制同时进行的AI请求数量
- 避免API调用频率过高

## 监控和日志

### 1. 日志记录
- AI调用成功/失败日志
- 响应时间监控
- 错误详情记录

### 2. 性能指标
- API调用成功率
- 平均响应时间
- 错误率统计

## 安全注意事项

### 1. API密钥安全
- 不要在代码中硬编码API密钥
- 使用环境变量管理敏感信息
- 定期轮换API密钥

### 2. 数据隐私
- 确保传输数据加密
- 遵守数据保护法规
- 定期清理敏感数据

## 故障排除

### 1. 常见问题
Q: AI分析没有返回结果
A: 检查API密钥配置和网络连接

Q: 分析结果不准确
A: 检查输入数据质量和模型参数设置

Q: 响应时间过长
A: 考虑使用缓存或优化请求参数

### 2. 联系支持
如遇到技术问题，请联系：
- 智谱AI官方支持：https://open.bigmodel.cn/
- 项目维护团队

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 支持基础价格分析功能
- 集成GLM-4模型

### v1.1.0 (2024-01-15)
- 新增市场趋势预测
- 优化错误处理机制
- 添加性能监控

### v1.2.0 (2024-02-01)
- 新增智能推荐系统
- 支持多模型切换
- 完善缓存策略 