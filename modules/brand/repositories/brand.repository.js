const { pool } = require('../../../lib/database/connection');

// 获取所有品牌
const getAll = async () => {
  const [rows] = await pool.query('SELECT * FROM brands ORDER BY id DESC');
  return rows;
};

// 获取所有品牌（带关键词）
const getAllWithKeyword = async (keyword = '') => {
  if (!keyword) return getAll();
  const [rows] = await pool.query('SELECT * FROM brands WHERE name LIKE ? ORDER BY id DESC', [`%${keyword}%`]);
  return rows;
};

// 获取单个品牌
const getById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM brands WHERE id = ?', [id]);
  return rows[0] || null;
};

// 新增品牌
const create = async (data) => {
  const { name, logo } = data;
  const [result] = await pool.query('INSERT INTO brands (name, logo) VALUES (?, ?)', [name, logo]);
  return { id: result.insertId, name, logo };
};

// 更新品牌
const update = async (id, data) => {
  const { name, logo } = data;
  await pool.query('UPDATE brands SET name = ?, logo = ? WHERE id = ?', [name, logo, id]);
  return { id, name, logo };
};

// 下架该品牌所有商品
const unpublishProductsByBrandId = async (brandId) => {
  await pool.query('UPDATE products SET status = 0 WHERE brand_id = ?', [brandId]);
};

// 删除品牌
const deleteBrand = async (id) => {
  const [result] = await pool.query('DELETE FROM brands WHERE id = ?', [id]);
  return result;
};

module.exports = {
  getAll,
  getAllWithKeyword,
  getById,
  create,
  update,
  unpublishProductsByBrandId,
  deleteBrand
};