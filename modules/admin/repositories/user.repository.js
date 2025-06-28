const db = require('../models');
const { Op } = require('sequelize');

exports.findAndCountAll = async (offset, limit, search) => {
  const where = {};
  
  if (search) {
    where[Op.or] = [
      { username: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } }
    ];
  }
  
  return await db.users.findAndCountAll({
    where,
    offset,
    limit,
    attributes: ['id', 'username', 'email', 'created_at', 'updated_at'],
    order: [['created_at', 'DESC']]
  });
};

exports.update = async (id, updateData) => {
  const user = await db.users.findByPk(id);
  if (!user) throw new Error('用户不存在');
  
  return await user.update(updateData);
};

exports.delete = async (id) => {
  const user = await db.users.findByPk(id);
  if (!user) throw new Error('用户不存在');
  
  return await user.destroy();
};