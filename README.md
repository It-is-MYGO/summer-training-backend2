# 动态模块 API 文档

## 概述

这是一个基于 Node.js + Express + MySQL 的动态模块后端API，支持动态的发布、编辑、点赞、评论、收藏等功能。

## 技术栈

- Node.js
- Express.js
- MySQL
- Multer (文件上传)

## 安装和运行

### 1. 安装依赖
```bash
npm install
```

### 2. 配置数据库
修改 `config/database.js` 中的数据库连接信息：
```javascript
module.exports = {
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'priceCompare',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
```

### 3. 初始化数据库
```bash
node database/init.js
```

### 4. 启动服务器
```bash
npm start
```

## API 接口文档

### 动态相关接口

#### 1. 创建动态
- **接口**: `POST /api/posts`
- **请求体**:
```json
{
  "content": "动态内容",
  "images": ["图片URL1", "图片URL2"],
  "userId": 1,
  "timestamp": "2024-06-01T12:00:00.000Z",
  "tags": ["标签1", "标签2"],
  "location": "位置信息",
  "visibility": "public",
  "product": {
    "name": "商品名称",
    "price": "¥5999",
    "image": "商品图片URL",
    "platform": "京东"
  }
}
```
- **响应**:
```json
{
  "code": 0,
  "message": "动态发布成功",
  "data": {
    "id": 1,
    "content": "动态内容",
    "images": ["图片URL1", "图片URL2"],
    "userId": 1,
    "username": "用户名",
    "userAvatar": "头像URL",
    "time": "2024-06-01 12:00",
    "likes": 0,
    "comments": 0,
    "isLiked": false,
    "canEdit": true,
    "canDelete": true
  }
}
```

#### 2. 获取动态列表
- **接口**: `GET /api/posts`
- **查询参数**:
  - `page`: 页码 (默认: 1)
  - `pageSize`: 每页数量 (默认: 10)
  - `keyword`: 搜索关键词
  - `tag`: 标签筛选
  - `sort`: 排序方式 (latest/popular/oldest)
  - `userId`: 当前用户ID
- **响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

#### 3. 获取动态详情
- **接口**: `GET /api/posts/:id`
- **查询参数**: `userId` (可选，当前用户ID)
- **响应**: 同创建动态的响应格式

#### 4. 更新动态
- **接口**: `PUT /api/posts/:id`
- **请求体**: 同创建动态
- **响应**: 同创建动态的响应格式

#### 5. 删除动态
- **接口**: `DELETE /api/posts/:id`
- **请求体**: `{"userId": 1}`
- **响应**:
```json
{
  "code": 0,
  "message": "删除成功",
  "data": null
}
```

#### 6. 点赞/取消点赞
- **接口**: `POST /api/posts/:id/like`
- **请求体**:
```json
{
  "userId": 1,
  "like": true
}
```
- **响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "likes": 12,
    "isLiked": true
  }
}
```

#### 7. 收藏/取消收藏
- **接口**: `POST /api/posts/:id/collect`
- **请求体**:
```json
{
  "userId": 1,
  "collect": true
}
```
- **响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "isCollected": true
  }
}
```

#### 8. 添加评论
- **接口**: `POST /api/posts/:id/comments`
- **请求体**:
```json
{
  "userId": 1,
  "content": "评论内容"
}
```
- **响应**:
```json
{
  "code": 0,
  "message": "评论成功",
  "data": {
    "id": 1,
    "userId": 1,
    "username": "用户名",
    "userAvatar": "头像URL",
    "content": "评论内容",
    "time": "2024-06-01 12:30"
  }
}
```

#### 9. 删除评论
- **接口**: `DELETE /api/posts/:postId/comments/:commentId`
- **请求体**: `{"userId": 1}`
- **响应**:
```json
{
  "code": 0,
  "message": "删除评论成功",
  "data": null
}
```

#### 10. 获取标签列表
- **接口**: `GET /api/posts/tags`
- **响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": ["标签1", "标签2", "标签3"]
}
```

#### 11. 获取推荐动态
- **接口**: `GET /api/posts/recommend`
- **查询参数**:
  - `userId`: 用户ID
  - `limit`: 数量限制 (默认: 10)
- **响应**: 同获取动态列表

### 文件上传接口

#### 1. 上传单张图片
- **接口**: `POST /api/upload/image`
- **请求类型**: `multipart/form-data`
- **参数**:
  - `file`: 图片文件
  - `userId`: 用户ID
- **响应**:
```json
{
  "code": 0,
  "message": "上传成功",
  "data": {
    "url": "http://localhost:3000/uploads/images/filename.jpg",
    "filename": "filename.jpg",
    "size": 1024000,
    "type": "image/jpeg"
  }
}
```

#### 2. 上传多张图片
- **接口**: `POST /api/upload/images`
- **请求类型**: `multipart/form-data`
- **参数**:
  - `files`: 图片文件数组 (最多4张)
  - `userId`: 用户ID
- **响应**: 返回上传文件数组

#### 3. 删除图片
- **接口**: `DELETE /api/upload/image/:filename`
- **响应**:
```json
{
  "code": 0,
  "message": "删除成功",
  "data": null
}
```

## 数据库表结构

### posts 表 (动态表)
- `id`: 主键
- `content`: 动态内容
- `images`: 图片URL数组 (JSON)
- `userId`: 发布者用户ID
- `time`: 发布时间
- `tags`: 标签数组 (JSON)
- `location`: 位置信息
- `visibility`: 可见性设置 (public/private/friends)
- `product`: 关联商品信息 (JSON)
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

### post_likes 表 (点赞表)
- `id`: 主键
- `postId`: 动态ID
- `userId`: 用户ID
- `createdAt`: 点赞时间

### post_collections 表 (收藏表)
- `id`: 主键
- `postId`: 动态ID
- `userId`: 用户ID
- `createdAt`: 收藏时间

### post_comments 表 (评论表)
- `id`: 主键
- `postId`: 动态ID
- `userId`: 评论者用户ID
- `content`: 评论内容
- `createdAt`: 评论时间

### post_shares 表 (分享表)
- `id`: 主键
- `postId`: 动态ID
- `userId`: 分享者用户ID
- `createdAt`: 分享时间

## 错误处理

所有接口都遵循统一的错误响应格式：
```json
{
  "code": 1,
  "message": "错误信息",
  "data": null
}
```

## 注意事项

1. 图片上传限制：
   - 文件大小：最大5MB
   - 文件类型：仅支持图片格式
   - 数量限制：单次最多4张

2. 权限控制：
   - 只有动态发布者和管理员可以编辑/删除动态
   - 只有评论发布者和管理员可以删除评论

3. 数据验证：
   - 动态内容不能为空
   - 评论内容不能超过500字
   - 用户ID必须有效

## 测试

启动服务器后，可以使用以下测试数据：
- 测试用户1: testuser1 / password
- 测试用户2: testuser2 / password

这些用户已经预置了一些测试动态数据。 