const ProductPrice = require('../../price/models/price');

// 模拟数据库连接
jest.mock('../../../lib/database/connection', () => ({
  pool: {
    query: jest.fn()
  }
}));

describe('图表数据生成测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findChartData', () => {
    it('应该正确生成平台价格对比数据', async () => {
      const mockData = [
        { platform: '京东', date: '2024-01-01', price: '3599' },
        { platform: '京东', date: '2024-01-05', price: '3499' },
        { platform: '京东', date: '2024-01-10', price: '3399' },
        { platform: '天猫', date: '2024-01-01', price: '3699' },
        { platform: '天猫', date: '2024-01-05', price: '3599' },
        { platform: '天猫', date: '2024-01-10', price: '3499' },
        { platform: '拼多多', date: '2024-01-01', price: '3299' },
        { platform: '拼多多', date: '2024-01-05', price: '3199' },
        { platform: '拼多多', date: '2024-01-10', price: '3099' }
      ];

      const { pool } = require('../../../lib/database/connection');
      pool.query.mockResolvedValueOnce([mockData]);

      const result = await ProductPrice.findChartData(1);

      // 验证查询SQL
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT platform, date, price'),
        [1]
      );

      // 验证返回数据结构
      expect(result).toHaveProperty('京东');
      expect(result).toHaveProperty('天猫');
      expect(result).toHaveProperty('拼多多');

      // 验证数据格式
      expect(Array.isArray(result['京东'])).toBe(true);
      expect(result['京东'][0]).toHaveProperty('date');
      expect(result['京东'][0]).toHaveProperty('price');
      expect(typeof result['京东'][0].price).toBe('number');

      // 验证数据排序
      expect(result['京东'][0].date).toBe('2024-01-01');
      expect(result['京东'][1].date).toBe('2024-01-05');
      expect(result['京东'][2].date).toBe('2024-01-10');
    });

    it('应该处理空数据的情况', async () => {
      const { pool } = require('../../../lib/database/connection');
      pool.query.mockResolvedValueOnce([[]]);

      const result = await ProductPrice.findChartData(1);

      expect(result).toEqual({});
    });

    it('应该处理数据库错误', async () => {
      const { pool } = require('../../../lib/database/connection');
      pool.query.mockRejectedValueOnce(new Error('数据库连接失败'));

      await expect(ProductPrice.findChartData(1)).rejects.toThrow('数据库连接失败');
    });
  });

  describe('findMonthlyAverage', () => {
    it('应该正确生成月度平均价格数据', async () => {
      const mockData = [
        { year: 2024, month: 1, avg_price: '3549.5' },
        { year: 2024, month: 2, avg_price: '3449.3' },
        { year: 2024, month: 3, avg_price: '3349.8' },
        { year: 2024, month: 4, avg_price: '3249.2' },
        { year: 2024, month: 5, avg_price: '3149.7' },
        { year: 2024, month: 6, avg_price: '3049.1' },
        { year: 2024, month: 7, avg_price: '3149.4' },
        { year: 2024, month: 8, avg_price: '3049.6' },
        { year: 2024, month: 9, avg_price: '2949.9' },
        { year: 2024, month: 10, avg_price: '2849.3' },
        { year: 2024, month: 11, avg_price: '2949.7' },
        { year: 2024, month: 12, avg_price: '2949.5' }
      ];

      const { pool } = require('../../../lib/database/connection');
      pool.query.mockResolvedValueOnce([mockData]);

      const result = await ProductPrice.findMonthlyAverage(1);

      // 验证查询SQL
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );

      // 验证返回数据格式
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(12);

      // 验证数据格式
      expect(result[0]).toHaveProperty('month');
      expect(result[0]).toHaveProperty('avgPrice');
      expect(typeof result[0].avgPrice).toBe('number');

      // 验证月份格式
      expect(result[0].month).toBe('2024-01');
      expect(result[1].month).toBe('2024-02');
      expect(result[11].month).toBe('2024-12');

      // 验证价格数据
      expect(result[0].avgPrice).toBe(3549.5);
      expect(result[1].avgPrice).toBe(3449.3);
    });

    it('应该处理单个月份数据', async () => {
      const mockData = [
        { year: 2024, month: 1, avg_price: '3549.5' }
      ];

      const { pool } = require('../../../lib/database/connection');
      pool.query.mockResolvedValueOnce([mockData]);

      const result = await ProductPrice.findMonthlyAverage(1);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].month).toBe('2024-01');
      expect(result[0].avgPrice).toBe(3549.5);
    });

    it('应该处理空数据的情况', async () => {
      const { pool } = require('../../../lib/database/connection');
      pool.query.mockResolvedValueOnce([[]]);

      const result = await ProductPrice.findMonthlyAverage(1);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('findPlatformPrices', () => {
    it('应该返回各平台最新价格', async () => {
      const mockData = [
        { platform: '京东自营', price: '3299', date: '2024-01-15' },
        { platform: '天猫官方旗舰', price: '3399', date: '2024-01-15' },
        { platform: '拼多多百亿补贴', price: '3199', date: '2024-01-15' },
        { platform: '苏宁易购', price: '3349', date: '2024-01-15' }
      ];

      const { pool } = require('../../../lib/database/connection');
      pool.query.mockResolvedValueOnce([mockData]);

      const result = await ProductPrice.findPlatformPrices(1);

      // 验证查询SQL包含子查询
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INNER JOIN'),
        [1, 1]
      );

      // 验证返回数据
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(4);

      // 验证数据格式
      result.forEach(item => {
        expect(item).toHaveProperty('platform');
        expect(item).toHaveProperty('price');
        expect(item).toHaveProperty('date');
      });

      // 验证平台数据
      const platforms = result.map(item => item.platform);
      expect(platforms).toContain('京东自营');
      expect(platforms).toContain('天猫官方旗舰');
      expect(platforms).toContain('拼多多百亿补贴');
      expect(platforms).toContain('苏宁易购');
    });
  });

  describe('findPriceHistory', () => {
    it('应该返回按日期排序的价格历史', async () => {
      const mockData = [
        { date: '2024-01-01', price: '3599', platform: '京东' },
        { date: '2024-01-05', price: '3499', platform: '京东' },
        { date: '2024-01-10', price: '3399', platform: '京东' },
        { date: '2024-01-15', price: '3299', platform: '京东' },
        { date: '2024-01-20', price: '3399', platform: '京东' },
        { date: '2024-01-25', price: '3299', platform: '京东' },
        { date: '2024-01-30', price: '3299', platform: '京东' }
      ];

      const { pool } = require('../../../lib/database/connection');
      pool.query.mockResolvedValueOnce([mockData]);

      const result = await ProductPrice.findPriceHistory(1);

      // 验证查询SQL
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY date ASC'),
        [1]
      );

      // 验证返回数据
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(7);

      // 验证数据排序
      expect(result[0].date).toBe('2024-01-01');
      expect(result[6].date).toBe('2024-01-30');

      // 验证数据格式
      result.forEach(item => {
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('price');
        expect(item).toHaveProperty('platform');
      });
    });
  });
}); 