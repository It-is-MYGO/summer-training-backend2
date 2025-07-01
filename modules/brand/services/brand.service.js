const brandRepo = require('../repositories/brand.repository');

const listBrands = () => brandRepo.getAll();
const getBrand = (id) => brandRepo.getById(id);
const addBrand = (data) => brandRepo.create(data);
const editBrand = (id, data) => brandRepo.update(id, data);
const removeBrand = (id) => brandRepo.remove(id);

module.exports = {
  listBrands,
  getBrand,
  addBrand,
  editBrand,
  removeBrand
};
