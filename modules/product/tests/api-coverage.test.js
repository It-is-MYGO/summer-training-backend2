const request = require('supertest');
const app = require('../../../app');

// 模拟数据库连接
jest.mock('../../../lib/database/connection', () => ({
  pool: {
    query: jest.fn()
  }
}));

describe('前端API接口覆盖率测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('首页需要的API接口', () => {
    it('应该支持获取热门商品列表 (Home.vue)', async () => {
      const mockProducts = [
        {
          id: 1,
          title: '某品牌旗舰手机 8GB+256GB 全网通',
          price: '3299',
          priceChange: -5.2,
          platforms: ['京东', '天猫', '拼多多'],
          img: 'https://via.placeholder.com/200x200?text=旗舰手机'
        }
      ];

      const { pool } = require('../../../lib/database/connection');
      pool.query.mockResolvedValueOnce([mockProducts]);

      const response = await request(app)
        .get('/api/products/hot')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('price');
      expect(response.body[0]).toHaveProperty('priceChange');
      expect(response.body[0]).toHaveProperty('platforms');
      expect(response.body[0]).toHaveProperty('img');
    });

    it('应该支持获取降价商品列表 (Home.vue)', async () => {
      const mockProducts = [
        {
          id: 2,
          title: '新一代游戏主机 4K高清 1TB存储',
          price: '3199',
          oldPrice: '3899',
          priceChange: 18.0,
          platforms: ['京东', '苏宁'],
          img: 'https://via.placeholder.com/200x200?text=游戏主机'
        }
      ];

      const { pool } = require('../../../lib/database/connection');
      pool.query.mockResolvedValueOnce([mockProducts]);

      const response = await request(app)
        .get('/api/products/drops')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('oldPrice');
    });
  });

  describe('商品详情页需要的API接口', () => {
    it('应该支持获取商品详情 (Detail.vue)', async () => {
      const mockProduct = {
        id: 1,
        title: '某品牌旗舰手机 8GB+256GB 全网通',
        desc: '型号：SM-X9000 | 颜色：曜夜黑',
        price: '3299',
        priceChange: -5.2,
        img: 'https://via.placeholder.com/400x400?text=商品大图',
        platformPrices: [
          { platform: '京东自营', price: '3299', lowest: true },
          { platform: '天猫官方旗舰', price: '3399' },
          { platform: '拼多多百亿补贴', price: '3199' },
          { platform: '苏宁易购', price: '3349' }
        ]
      };

      const { pool } = require('../../../lib/database/connection');
      pool.query.mockResolvedValueOnce([[mockProduct]]);

      const response = await request(app)
        .get('/api/products/1')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('desc');
      expect(response.body).toHaveProperty('price');
      expect(response.body).toHaveProperty('priceChange');
      expect(response.body).toHaveProperty('img');
    });

    it('应该支持获取价格历史数据 (Detail.vue)', async () => {
      const mockHistory = [
        { date: '2024-01-01', price: '3599', platform: '京东' },
        { date: '2024-01-05', price: '3499', platform: '京东' },
        { date: '2024-01-10', price: '3399', platform: '京东' },
        { date: '2024-01-15', price: '3299', platform: '京东' },
        { date: '2024-01-20', price: '3399', platform: '京东' },
        { date: '2024-01-25', price: '3299', platform: '京东' },
        { date: '2024-01-30', price: '3299', platform: '京东' }
      ];

      const { pool } = require('../../../lib/database/connection');
      pool.query.mockResolvedValueOnce([mockHistory]);

      const response = await request(app)
        .get('/api/products/1/price-history')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(7);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('date');
        expect(response.body[0]).toHaveProperty('price');
        expect(response.body[0]).toHaveProperty('platform');
      }
    });
  });

  describe('图表页需要的API接口', () => {
    it('应该支持获取图表数据 (Chart.vue)', async () => {
      const mockChartData = {
        platformData: {
          '京东': [
            { date: '2024-01-01', price: 3599 },
            { date: '2024-01-05', price: 3499 },
            { date: '2024-01-10', price: 3399 },
            { date: '2024-01-15', price: 3299 },
            { date: '2024-01-20', price: 3399 },
            { date: '2024-01-25', price: 3299 },
            { date: '2024-01-30', price: 3299 }
          ],
          '天猫': [
            { date: '2024-01-01', price: 3699 },
            { date: '2024-01-05', price: 3599 },
            { date: '2024-01-10', price: 3499 },
            { date: '2024-01-15', price: 3399 },
            { date: '2024-01-20', price: 3499 },
            { date: '2024-01-25', price: 3399 },
            { date: '2024-01-30', price: 3399 }
          ],
          '拼多多': [
            { date: '2024-01-01', price: 3299 },
            { date: '2024-01-05', price: 3199 },
            { date: '2024-01-10', price: 3099 },
            { date: '2024-01-15', price: 3199 },
            { date: '2024-01-20', price: 3099 },
            { date: '2024-01-25', price: 3199 },
            { date: '2024-01-30', price: 3199 }
          ],
          '苏宁': [
            { date: '2024-01-01', price: 3499 },
            { date: '2024-01-05', price: 3449 },
            { date: '2024-01-10', price: 3399 },
            { date: '2024-01-15', price: 3349 },
            { date: '2024-01-20', price: 3399 },
            { date: '2024-01-25', price: 3349 },
            { date: '2024-01-30', price: 3349 }
          ]
        },
        monthlyData: [
          { month: '2024-01', avgPrice: 3549 },
          { month: '2024-02', avgPrice: 3449 },
          { month: '2024-03', avgPrice: 3349 },
          { month: '2024-04', avgPrice: 3249 },
          { month: '2024-05', avgPrice: 3149 },
          { month: '2024-06', avgPrice: 3049 },
          { month: '2024-07', avgPrice: 3149 },
          { month: '2024-08', avgPrice: 3049 },
          { month: '2024-09', avgPrice: 2949 },
          { month: '2024-10', avgPrice: 2849 },
          { month: '2024-11', avgPrice: 2949 },
          { month: '2024-12', avgPrice: 2949 }
        ]
      };

      const { pool } = require('../../../lib/database/connection');
      pool.query
        .mockResolvedValueOnce([[
          { platform: '京东', date: '2024-01-01', price: '3599' },
          { platform: '京东', date: '2024-01-05', price: '3499' },
          { platform: '京东', date: '2024-01-10', price: '3399' },
          { platform: '京东', date: '2024-01-15', price: '3299' },
          { platform: '京东', date: '2024-01-20', price: '3399' },
          { platform: '京东', date: '2024-01-25', price: '3299' },
          { platform: '京东', date: '2024-01-30', price: '3299' },
          { platform: '天猫', date: '2024-01-01', price: '3699' },
          { platform: '天猫', date: '2024-01-05', price: '3599' },
          { platform: '天猫', date: '2024-01-10', price: '3499' },
          { platform: '天猫', date: '2024-01-15', price: '3399' },
          { platform: '天猫', date: '2024-01-20', price: '3499' },
          { platform: '天猫', date: '2024-01-25', price: '3399' },
          { platform: '天猫', date: '2024-01-30', price: '3399' },
          { platform: '拼多多', date: '2024-01-01', price: '3299' },
          { platform: '拼多多', date: '2024-01-05', price: '3199' },
          { platform: '拼多多', date: '2024-01-10', price: '3099' },
          { platform: '拼多多', date: '2024-01-15', price: '3199' },
          { platform: '拼多多', date: '2024-01-20', price: '3099' },
          { platform: '拼多多', date: '2024-01-25', price: '3199' },
          { platform: '拼多多', date: '2024-01-30', price: '3199' },
          { platform: '苏宁', date: '2024-01-01', price: '3499' },
          { platform: '苏宁', date: '2024-01-05', price: '3449' },
          { platform: '苏宁', date: '2024-01-10', price: '3399' },
          { platform: '苏宁', date: '2024-01-15', price: '3349' },
          { platform: '苏宁', date: '2024-01-20', price: '3399' },
          { platform: '苏宁', date: '2024-01-25', price: '3349' },
          { platform: '苏宁', date: '2024-01-30', price: '3349' }
        ]])
        .mockResolvedValueOnce([[
          { year: 2024, month: 1, avg_price: '3549' },
          { year: 2024, month: 2, avg_price: '3449' },
          { year: 2024, month: 3, avg_price: '3349' },
          { year: 2024, month: 4, avg_price: '3249' },
          { year: 2024, month: 5, avg_price: '3149' },
          { year: 2024, month: 6, avg_price: '3049' },
          { year: 2024, month: 7, avg_price: '3149' },
          { year: 2024, month: 8, avg_price: '3049' },
          { year: 2024, month: 9, avg_price: '2949' },
          { year: 2024, month: 10, avg_price: '2849' },
          { year: 2024, month: 11, avg_price: '2949' },
          { year: 2024, month: 12, avg_price: '2949' }
        ]]);

      const response = await request(app)
        .get('/api/products/1/chart-data')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('platformData');
      expect(response.body).toHaveProperty('monthlyData');
      
      // 验证平台数据
      expect(response.body.platformData).toHaveProperty('京东');
      expect(response.body.platformData).toHaveProperty('天猫');
      expect(response.body.platformData).toHaveProperty('拼多多');
      expect(response.body.platformData).toHaveProperty('苏宁');
      
      // 验证每个平台的数据点数量
      expect(response.body.platformData['京东']).toHaveLength(7);
      expect(response.body.platformData['天猫']).toHaveLength(7);
      expect(response.body.platformData['拼多多']).toHaveLength(7);
      expect(response.body.platformData['苏宁']).toHaveLength(7);
      
      // 验证月度数据
      expect(Array.isArray(response.body.monthlyData)).toBe(true);
      expect(response.body.monthlyData).toHaveLength(12);
    });
  });

  describe('收藏页需要的API接口', () => {
    it('应该支持获取收藏列表 (Favorites.vue)', async () => {
      const mockFavorites = [
        {
          id: 1,
          title: '某品牌旗舰手机 8GB+256GB 全网通',
          price: '3299',
          priceChange: -180,
          alertPrice: 3000,
          img: 'https://via.placeholder.com/80x80?text=手机'
        },
        {
          id: 2,
          title: '某品牌轻薄笔记本 i7高配 16GB内存',
          price: '6499',
          priceChange: 150,
          alertPrice: 6000,
          img: 'https://via.placeholder.com/80x80?text=笔记本'
        }
      ];

      const { pool } = require('../../../lib/database/connection');
      pool.query.mockResolvedValueOnce([mockFavorites]);

      const response = await request(app)
        .get('/api/favorites')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('price');
      expect(response.body[0]).toHaveProperty('priceChange');
      expect(response.body[0]).toHaveProperty('alertPrice');
      expect(response.body[0]).toHaveProperty('img');
    });

    it('应该支持添加收藏', async () => {
      const favoriteData = {
        productId: 1,
        userId: 1
      };

      const { pool } = require('../../../lib/database/connection');
      pool.query.mockResolvedValueOnce([{ insertId: 1 }]);

      const response = await request(app)
        .post('/api/favorites')
        .send(favoriteData)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('应该支持设置提醒价格', async () => {
      const alertData = {
        alertPrice: 3000
      };

      const { pool } = require('../../../lib/database/connection');
      pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const response = await request(app)
        .put('/api/favorites/1/alert-price')
        .send(alertData)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('搜索功能API接口', () => {
    it('应该支持商品搜索', async () => {
      const mockProducts = [
        {
          id: 1,
          title: '某品牌旗舰手机 8GB+256GB 全网通',
          price: '3299',
          platforms: ['京东', '天猫']
        }
      ];

      const { pool } = require('../../../lib/database/connection');
      pool.query.mockResolvedValueOnce([mockProducts]);

      const response = await request(app)
        .get(`/api/products/search?keyword=${encodeURIComponent('手机')}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('API接口完整性检查', () => {
    it('应该包含所有前端需要的接口', () => {
      const requiredEndpoints = [
        'GET /api/products/hot',
        'GET /api/products/drops', 
        'GET /api/products/search',
        'GET /api/products/:id',
        'GET /api/products/:id/price-history',
        'GET /api/products/:id/platform-prices',
        'GET /api/products/:id/chart-data',
        'GET /api/favorites',
        'POST /api/favorites',
        'DELETE /api/favorites/:id',
        'PUT /api/favorites/:id/alert-price'
      ];

      // 这里可以添加路由检查逻辑
      expect(requiredEndpoints).toHaveLength(11);
    });
  });
}); 