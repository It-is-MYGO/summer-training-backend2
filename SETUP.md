# 动态模块后端设置指南

## 前置要求

1. **Node.js** (版本 14 或更高)
2. **MySQL** (版本 5.7 或更高)

## 安装步骤

### 1. 安装依赖
```bash
npm install
```

### 2. 配置数据库

#### 2.1 启动MySQL服务
确保MySQL服务正在运行。

#### 2.2 修改数据库配置
编辑 `config/database.js` 文件，根据你的MySQL配置修改连接信息：

```javascript
module.exports = {
  host: 'localhost',
  user: 'root',
  password: 'your_mysql_password', // 修改为你的MySQL密码
  database: 'priceCompare',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
```

#### 2.3 测试数据库连接
```bash
node test-db.js
```

如果连接成功，你会看到：
```
数据库连接成功！
数据库 priceCompare 已存在
连接测试完成
```

#### 2.4 初始化数据库表
```bash
node database/init.js
```

这将创建所有必要的数据库表并插入测试数据。

### 3. 启动服务器
```bash
npm start
```

服务器将在 http://localhost:3000 启动。

## 常见问题

### 1. 数据库连接失败
**错误信息**: `Access denied for user 'root'@'localhost'`

**解决方案**:
- 检查MySQL服务是否启动
- 验证用户名和密码是否正确
- 确保用户有足够的权限

### 2. 数据库不存在
**错误信息**: `Unknown database 'priceCompare'`

**解决方案**:
- 运行 `node test-db.js` 自动创建数据库
- 或手动创建数据库：`CREATE DATABASE priceCompare;`

### 3. 端口被占用
**错误信息**: `EADDRINUSE`

**解决方案**:
- 修改 `index.js` 中的端口号
- 或停止占用端口的其他服务

## 测试API

启动服务器后，可以使用以下测试数据：

### 测试用户
- 用户名: `testuser1`, 密码: `password`
- 用户名: `testuser2`, 密码: `password`

### 测试API端点
```bash
# 获取动态列表
curl http://localhost:3000/api/posts

# 获取标签列表
curl http://localhost:3000/api/posts/tags

# 获取推荐动态
curl http://localhost:3000/api/posts/recommend
```

## 文件结构

```
summer-training-backend2/
├── config/
│   └── database.js          # 数据库配置
├── database/
│   ├── init.js              # 数据库初始化脚本
│   └── schema.sql           # 数据库表结构
├── lib/
│   └── database/
│       └── connection.js    # 数据库连接
├── modules/
│   ├── post/                # 动态模块
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   └── services/
│   └── upload/              # 文件上传模块
│       ├── controllers/
│       └── routes/
├── uploads/                 # 上传文件目录
├── app.js                   # 主应用文件
├── index.js                 # 服务器入口
└── README.md               # API文档
```

## 开发说明

### 添加新功能
1. 在 `modules/` 下创建新的模块目录
2. 按照 MVC 模式组织代码
3. 在 `app.js` 中注册新路由

### 数据库迁移
1. 修改 `database/schema.sql`
2. 运行 `node database/init.js`

### 部署
1. 设置环境变量
2. 配置生产环境数据库
3. 使用 PM2 或类似工具管理进程 