const request = require('supertest');
const app = require('../../../app');

// 模拟数据库连接
jest.mock('../../../lib/database/connection', () => ({
  pool: {
    query: jest.fn()
  }
}));

describe('增强图表功能测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products/:id/chart-data?enhanced=true', () => {
    it('应该返回增强的图表数据', async () => {
      const mockChartData = [
        { platform: '京东', date: '2024-01-01', price: '3599' },
        { platform: '京东', date: '2024-01-05', price: '3499' },
        { platform: '天猫', date: '2024-01-01', price: '3699' },
        { platform: '天猫', date: '2024-01-05', price: '3599' }
      ];

      const mockMonthlyData = [
        { year: 2024, month: 1, avg_price: '3549' },
        { year: 2024, month: 2, avg_price: '3449' }
      ];

      const mockFluctuationData = [
        {
          platform: '京东',
          min_price: '3299',
          max_price: '3599',
          avg_price: '3449',
          data_points: 10
        },
        {
          platform: '天猫',
          min_price: '3399',
          max_price: '3799',
          avg_price: '3599',
          data_points: 10
        }
      ];

      const mockTrendData = [
        {
          platform: '京东',
          date: '2024-01-05',
          price: '3499',
          prev_price: '3599'
        },
        {
          platform: '天猫',
          date: '2024-01-05',
          price: '3599',
          prev_price: '3699'
        }
      ];

      const { pool } = require('../../../lib/database/connection');
      pool.query
        .mockResolvedValueOnce([mockChartData])
        .mockResolvedValueOnce([mockMonthlyData])
        .mockResolvedValueOnce([mockFluctuationData])
        .mockResolvedValueOnce([mockTrendData]);

      const response = await request(app)
        .get('/api/products/1/chart-data?enhanced=true')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('platformData');
      expect(response.body).toHaveProperty('monthlyData');
      expect(response.body).toHaveProperty('fluctuationData');
      expect(response.body).toHaveProperty('trendData');
      expect(response.body).toHaveProperty('priceStats');

      // 验证价格统计
      expect(response.body.priceStats).toHaveProperty('totalFluctuation');
      expect(response.body.priceStats).toHaveProperty('averageFluctuation');
      expect(response.body.priceStats).toHaveProperty('mostVolatilePlatform');
      expect(response.body.priceStats).toHaveProperty('leastVolatilePlatform');
    });

    it('应该处理数据库错误', async () => {
      const { pool } = require('../../../lib/database/connection');
      pool.query.mockRejectedValueOnce(new Error('数据库连接失败'));

      const response = await request(app)
        .get('/api/products/1/chart-data?enhanced=true')
        .expect(500);

      expect(response.body.message).toBe('获取图表数据失败');
    });
  });

  describe('GET /api/products/:id/price-prediction', () => {
    it('应该返回价格预测数据', async () => {
      const mockMonthlyData = [
        { year: 2024, month: 1, avg_price: '3549' },
        { year: 2024, month: 2, avg_price: '3449' },
        { year: 2024, month: 3, avg_price: '3349' },
        { year: 2024, month: 4, avg_price: '3249' },
        { year: 2024, month: 5, avg_price: '3149' },
        { year: 2024, month: 6, avg_price: '3049' }
      ];

      const { pool } = require('../../../lib/database/connection');
      pool.query.mockResolvedValueOnce([mockMonthlyData]);

      const response = await request(app)
        .get('/api/products/1/price-prediction')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('currentTrend');
      expect(response.body).toHaveProperty('predictedPrice');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body).toHaveProperty('slope');

      // 验证趋势类型
      expect(['上涨', '下跌', '稳定']).toContain(response.body.currentTrend);
      expect(['高', '中', '低']).toContain(response.body.confidence);
      expect(typeof response.body.predictedPrice).toBe('number');
      expect(typeof response.body.slope).toBe('number');
    });

    it('应该处理数据不足的情况', async () => {
      const mockMonthlyData = [
        { year: 2024, month: 1, avg_price: '3549' },
        { year: 2024, month: 2, avg_price: '3449' }
      ];

      const { pool } = require('../../../lib/database/connection');
      pool.query.mockResolvedValueOnce([mockMonthlyData]);

      const response = await request(app)
        .get('/api/products/1/price-prediction')
        .expect(200);

      expect(response.body).toHaveProperty('prediction');
      expect(response.body.prediction).toBe('数据不足，无法预测');
    });
  });

  describe('图表数据质量测试', () => {
    it('应该确保图表数据的连续性', async () => {
      const mockChartData = [
        { platform: '京东', date: '2024-01-01', price: '3599' },
        { platform: '京东', date: '2024-01-03', price: '3499' },
        { platform: '京东', date: '2024-01-05', price: '3399' },
        { platform: '天猫', date: '2024-01-01', price: '3699' },
        { platform: '天猫', date: '2024-01-05', price: '3599' }
      ];

      const { pool } = require('../../../lib/database/connection');
      pool.query
        .mockResolvedValueOnce([mockChartData])
        .mockResolvedValueOnce([[]]);

      const response = await request(app)
        .get('/api/products/1/chart-data')
        .expect(200);

      expect(response.body.platformData).toHaveProperty('京东');
      expect(response.body.platformData).toHaveProperty('天猫');

      // 验证数据连续性（应该自动填充缺失的日期）
      const jdData = response.body.platformData['京东'];
      const tmallData = response.body.platformData['天猫'];

      // 检查数据是否按日期排序
      for (let i = 1; i < jdData.length; i++) {
        expect(new Date(jdData[i].date) >= new Date(jdData[i-1].date)).toBe(true);
      }

      for (let i = 1; i < tmallData.length; i++) {
        expect(new Date(tmallData[i].date) >= new Date(tmallData[i-1].date)).toBe(true);
      }
    });

    it('应该正确处理价格数据类型转换', async () => {
      const mockData = [
        { platform: '京东', date: '2024-01-01', price: '3599.50' },
        { platform: '京东', date: '2024-01-05', price: '3499.00' }
      ];

      const { pool } = require('../../../lib/database/connection');
      pool.query
        .mockResolvedValueOnce([mockData])
        .mockResolvedValueOnce([[]]);

      const response = await request(app)
        .get('/api/products/1/chart-data')
        .expect(200);

      const jdData = response.body.platformData['京东'];
      expect(typeof jdData[0].price).toBe('number');
      expect(jdData[0].price).toBe(3599.5);
      expect(jdData[1].price).toBe(3499);
    });
  });

  describe('价格波动统计测试', () => {
    it('应该正确计算价格波动统计', async () => {
      const mockFluctuationData = [
        {
          platform: '京东',
          min_price: '3299',
          max_price: '3599',
          avg_price: '3449',
          data_points: 10
        },
        {
          platform: '天猫',
          min_price: '3399',
          max_price: '3799',
          avg_price: '3599',
          data_points: 10
        }
      ];

      const { pool } = require('../../../lib/database/connection');
      pool.query
        .mockResolvedValueOnce([[]]) // chartData
        .mockResolvedValueOnce([[]]) // monthlyData
        .mockResolvedValueOnce([mockFluctuationData])
        .mockResolvedValueOnce([[]]); // trendData

      const response = await request(app)
        .get('/api/products/1/chart-data?enhanced=true')
        .expect(200);

      const stats = response.body.priceStats;
      // 京东波动: 3599-3299 = 300, 天猫波动: 3799-3399 = 400
      // 总波动: 300 + 400 = 700, 平均波动: 700 / 2 = 350
      expect(stats.totalFluctuation).toBe(700);
      expect(stats.averageFluctuation).toBe(350);
      expect(stats.mostVolatilePlatform.platform).toBe('天猫');
      expect(stats.leastVolatilePlatform.platform).toBe('京东');
    });
  });
}); 