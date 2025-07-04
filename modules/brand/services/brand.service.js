const brandRepo = require('../repositories/brand.repository');

module.exports = {
  listBrands: (keyword = '') => brandRepo.getAllWithKeyword(keyword),
  getBrand: (id) => brandRepo.getById(id),
  addBrand: (data) => brandRepo.create(data),
  editBrand: (id, data) => brandRepo.update(id, data),
  async deleteBrand(brandId) {
    // 先下架所有商品
    await brandRepo.unpublishProductsByBrandId(brandId);
    // 再删除品牌
    return await brandRepo.deleteBrand(brandId);
  },
  getPaged: (page, pageSize) => brandRepo.getPaged(page, pageSize)
};
