const brandService = require('../services/brand.service');

const list = async (req, res) => {
  const brands = await brandService.listBrands();
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

const remove = async (req, res) => {
  await brandService.removeBrand(req.params.id);
  res.json({ message: 'Deleted' });
};

module.exports = {
  list,
  get,
  create,
  update,
  remove
};

