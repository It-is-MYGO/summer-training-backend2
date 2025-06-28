const Brand = require('../models/Brand');
const { Op } = require('sequelize');

class BrandRepository {
  async create(brandData) {
    return await Brand.create(brandData);
  }

  async findById(id) {
    return await Brand.findByPk(id);
  }

  async findByName(name) {
    return await Brand.findOne({ where: { name } });
  }

  async findAll({ page = 1, limit = 10, search = '' }) {
    const where = {};
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    return await Brand.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });
  }

  async update(id, updateData) {
    const brand = await Brand.findByPk(id);
    if (!brand) throw new Error('Brand not found');
    return await brand.update(updateData);
  }

  async delete(id) {
    const brand = await Brand.findByPk(id);
    if (!brand) throw new Error('Brand not found');
    return await brand.destroy();
  }
}

module.exports = new BrandRepository();