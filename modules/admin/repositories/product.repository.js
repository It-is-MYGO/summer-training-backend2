const Product = require('../models/Product');
const { Op } = require('sequelize');

class ProductRepository {
  /**
   * 创建新产品
   * @param {Object} productData 产品数据
   * @returns {Promise<Product>}
   */
  async create(productData) {
    return await Product.create(productData);
  }

  /**
   * 通过ID查找产品
   * @param {number} id 产品ID
   * @returns {Promise<Product|null>}
   */
  async findById(id) {
    return await Product.findByPk(id);
  }

  /**
   * 查找所有产品（带分页和搜索）
   * @param {Object} options
   * @param {number} options.page 页码
   * @param {number} options.limit 每页数量
   * @param {string} options.search 搜索关键词
   * @param {string|null} options.status 状态筛选 (is_drop)
   * @returns {Promise<{count: number, rows: Product[]}>}
   */
  async findAll({ page = 1, limit = 10, search = '', status = null }) {
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { desc: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status !== null) {
      where.is_drop = status === 'dropped';
    }

    return await Product.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * 更新产品
   * @param {number} id 产品ID
   * @param {Object} updateData 更新数据
   * @returns {Promise<Product>}
   */
  async update(id, updateData) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error('Product not found');
    return await product.update(updateData);
  }

  /**
   * 删除产品
   * @param {number} id 产品ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error('Product not found');
    await product.destroy();
    return true;
  }

  /**
   * 切换产品上下架状态
   * @param {number} id 产品ID
   * @returns {Promise<Product>}
   */
  async toggleStatus(id) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error('Product not found');
    
    return await product.update({ 
      is_drop: !product.is_drop 
    });
  }

  /**
   * 获取热门产品
   * @param {number} limit 数量限制
   * @returns {Promise<Product[]>}
   */
  async findHotProducts(limit = 5) {
    return await Product.findAll({
      where: { is_hot: true },
      limit,
      order: [['created_at', 'DESC']]
    });
  }
}

module.exports = new ProductRepository();