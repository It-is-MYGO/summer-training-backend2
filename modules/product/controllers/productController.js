// 处理商品相关的HTTP请求（Express）
const productService = require('../services/productService');
const { pool } = require('../../../lib/database/connection');

module.exports = {
  async getHotProducts(req, res) {
    try {
      const products = await productService.getHotProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: '获取热门商品失败', error: error.message });
    }
  },

  async getDropProducts(req, res) {
    try {
      const products = await productService.getDropProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: '获取降价商品失败', error: error.message });
    }
  },

  async search(req, res) {
    try {
      const { keyword } = req.query;
      if (!keyword) {
        return res.status(400).json({ message: '搜索关键词不能为空' });
      }
      const products = await productService.searchProducts(keyword);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: '搜索商品失败', error: error.message });
    }
  },

  async getDetail(req, res) {
    try {
      const { id } = req.params;
      const product = await productService.getProductDetail(id);
      if (!product) {
        return res.status(404).json({ code: 1, message: '商品不存在' });
      }
      res.json({ code: 0, message: '获取成功', data: product });
    } catch (error) {
      res.status(500).json({ code: 1, message: '获取商品详情失败', error: error.message });
    }
  },

  async getPriceHistory(req, res) {
    try {
      const { id } = req.params;
      const history = await productService.getPriceHistory(id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: '获取价格历史失败', error: error.message });
    }
  },

  async getPlatformPrices(req, res) {
    try {
      const { id } = req.params;
      const prices = await productService.getPlatformPrices(id);
      res.json(prices);
    } catch (error) {
      res.status(500).json({ message: '获取平台价格失败', error: error.message });
    }
  },

  async getAllProducts(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 12;
      const includeOffline = req.query.includeOffline === 'true';
      const category = req.query.category;
      const status = req.query.status;
      const offset = (page - 1) * pageSize;

      // 构建查询条件
      let whereConditions = [];
      let params = [];

      if (!includeOffline) {
        whereConditions.push('p.status = 1');
      }

      if (category) {
        if (category === '未分类') {
          // 分类映射规则，与图表分析页保持一致
          const categoryMap = {
            0: '手机数码',
            1: '服装鞋帽',
            2: '运动户外',
            3: '家居生活',
            4: '食品饮料',
            5: '母婴用品',
            6: '美妆护肤',
            7: '图书音像',
            8: '汽车用品',
            9: '医药保健',
            10: '未分类',
            '手机数码': '手机数码',
            '服装鞋帽': '服装鞋帽',
            '运动户外': '运动户外',
            '家居生活': '家居生活',
            '食品饮料': '食品饮料',
            '母婴用品': '母婴用品',
            '美妆护肤': '美妆护肤',
            '图书音像': '图书音像',
            '汽车用品': '汽车用品',
            '医药保健': '医药保健',
            '未分类': '未分类'
          };
          
          // 筛选所有不在映射表中的分类，以及空值
          const mappedCategories = Object.values(categoryMap);
          const unmappedConditions = [];
          unmappedConditions.push('(p.category IS NULL OR p.category = "" OR p.category = "null" OR p.category = "undefined")');
          
          // 添加所有不在映射表中的分类
          unmappedConditions.push('p.category NOT IN (?)');
          params.push(mappedCategories);
          
          whereConditions.push(`(${unmappedConditions.join(' OR ')})`);
        } else {
          // 对于标准分类，先尝试直接匹配
          whereConditions.push('p.category = ?');
          params.push(category);
        }
      }

      if (status !== undefined && status !== '') {
        whereConditions.push('p.status = ?');
        params.push(parseInt(status));
      }

      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
      const countWhereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

      // 查询总数
      const [countRows] = await pool.query(`SELECT COUNT(*) as count FROM products p ${countWhereClause}`, params);
      const total = countRows[0].count;

      // 查询分页数据
      const queryParams = [...params, pageSize, offset];
      const [rows] = await pool.query(
        `SELECT p.*, 
                (SELECT MIN(pp.price) FROM product_prices pp WHERE pp.product_id = p.id) as price,
                (SELECT JSON_ARRAYAGG(pp.platform) FROM product_prices pp WHERE pp.product_id = p.id) as platforms
         FROM products p
         ${whereClause}
         ORDER BY p.id DESC
         LIMIT ? OFFSET ?`,
        queryParams
      );

      res.json({
        code: 0,
        data: {
          products: rows,
          total
        }
      });
    } catch (err) {
      console.error('getAllProducts error:', err);
      res.status(500).json({ code: 1, message: '获取全部商品失败', error: err.message, stack: err.stack });
    }
  },

  // 统一的图表数据接口，支持基础版和增强版
  async getChartData(req, res) {
    try {
      const { id } = req.params;
      const { enhanced } = req.query;
      
      // 通过查询参数控制是否返回增强数据
      const isEnhanced = enhanced === 'true' || enhanced === '1';
      const chartData = await productService.getChartData(id, isEnhanced);
      
      res.json(chartData);
    } catch (error) {
      res.status(500).json({ message: '获取图表数据失败', error: error.message });
    }
  },

  // 获取价格预测
  async getPricePrediction(req, res) {
    try {
      const { id } = req.params;
      const prediction = await productService.getPricePrediction(id);
      res.json(prediction);
    } catch (error) {
      res.status(500).json({ message: '获取价格预测失败', error: error.message });
    }
  },

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (typeof status === 'undefined') {
        return res.status(400).json({ code: 1, message: '缺少status参数' });
      }
      await productService.updateStatus(id, status);
      res.json({ code: 0, message: '状态更新成功' });
    } catch (error) {
      res.status(500).json({ code: 1, message: '状态更新失败', error: error.message });
    }
  },

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      await productService.deleteProduct(id);
      res.json({ code: 0, message: '商品已删除' });
    } catch (error) {
      res.status(500).json({ code: 1, message: '删除失败', error: error.message });
    }
  },

  async createProduct(req, res) {
    try {
      const product = req.body;
      if (!product.title) {
        return res.status(400).json({ code: 1, message: '商品标题不能为空' });
      }
      const result = await productService.createProduct(product);
      res.json({ code: 0, message: '商品添加成功', data: result });
    } catch (error) {
      res.status(500).json({ code: 1, message: '添加商品失败', error: error.message });
    }
  },

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      let { brand_id, new_brand_name, ...data } = req.body;

      // 如果是新品牌
      if (new_brand_name) {
        // 查找或插入品牌
        const [brand] = await productService.findOrCreateBrandByName(new_brand_name);
        brand_id = brand.id;
      }

      await productService.updateProduct(id, { ...data, brand_id });
      res.json({ code: 0, message: '商品信息已更新' });
    } catch (error) {
      res.status(500).json({ code: 1, message: '更新商品失败', error: error.message });
    }
  },

  async addProductPrice(req, res) {
    try {
      const { product_id, platform, price } = req.body;
      if (!product_id || !platform || !price) {
        return res.status(400).json({ code: 1, message: '缺少参数' });
      }
      await productService.addProductPrice({ product_id, platform, price });
      res.json({ code: 0, message: '价格已添加' });
    } catch (error) {
      console.error('添加价格失败:', error, '请求体:', req.body);
      res.status(500).json({ code: 1, message: '添加价格失败', error: error.message });
    }
  },

  // 获取所有品牌及商品数
  async getBrands(req, res) {
    try {
      const brands = await productService.getBrands();
      res.json({ code: 0, message: '获取成功', data: brands });
    } catch (error) {
      res.status(500).json({ code: 1, message: '获取品牌列表失败', error: error.message });
    }
  },

  // 获取某品牌下的商品
  async getProductsByBrand(req, res) {
    try {
      const { brandId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const { rows, total } = await productService.getProductsByBrand(brandId, page, pageSize);
      res.json({
        code: 0,
        message: '获取成功',
        data: {
          list: rows,
          total,
          page,
          pageSize,
          brandId
        }
      });
    } catch (error) {
      res.status(500).json({ code: 1, message: '获取品牌商品失败', error: error.message });
    }
  },

  // 获取商品分类分布数据
  async getCategoryDistribution(req, res) {
    try {
      const distribution = await productService.getCategoryDistribution();
      res.json({ 
        code: 0, 
        message: '获取分类分布成功', 
        data: distribution 
      });
    } catch (error) {
      res.status(500).json({ 
        code: 1, 
        message: '获取分类分布失败', 
        error: error.message 
      });
    }
  }
};

console.log('productController:', module.exports);
