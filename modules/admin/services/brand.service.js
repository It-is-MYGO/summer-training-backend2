const brandRepository = require('../repositories/brand.repository');

exports.getAllBrands = async () => {
  return await brandRepository.findAll();
};

exports.createBrand = async (brandData) => {
  return await brandRepository.create(brandData);
};

exports.updateBrand = async (id, updateData) => {
  return await brandRepository.update(id, updateData);
};

exports.deleteBrand = async (id) => {
  return await brandRepository.delete(id);
};