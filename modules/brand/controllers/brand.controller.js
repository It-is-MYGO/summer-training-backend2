const brandService = require('../services/brand.service');

const list = async (req, res) => {
  const keyword = req.query.keyword || '';
  const brands = await brandService.listBrands(keyword);
  res.json(brands);
};

const get = async (req, res) => {
  const brand = await brandService.getBrand(req.params.id);
  if (!brand) return res.status(404).json({ message: 'Not found' });
  res.json(brand);
};

const create = async (req, res) => {
  const brand = await brandService.addBrand(req.body);
  res.status(201).json(brand);
};

const update = async (req, res) => {
  await brandService.editBrand(req.params.id, req.body);
  res.json({ message: 'Updated' });
};

const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    await brandService.deleteBrand(id);
    res.json({ code: 0, message: '品牌已删除，相关商品已下架' });
  } catch (error) {
    res.status(500).json({ code: 1, message: '删除品牌失败', error: error.message });
  }
};

module.exports = {
  list,
  get,
  create,
  update,
  deleteBrand
};

