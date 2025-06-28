const brandService = require('../services/brand.service');
const { handleSuccess } = require('../../../lib/utils/response');

exports.getAllBrands = async (req, res, next) => {
  try {
    const brands = await brandService.getAllBrands();
    handleSuccess(res, { data: brands });
  } catch (error) {
    next(error);
  }
};

exports.createBrand = async (req, res, next) => {
  try {
    const brandData = req.body;
    const newBrand = await brandService.createBrand(brandData);
    handleSuccess(res, { data: newBrand, message: '品牌创建成功' }, 201);
  } catch (error) {
    next(error);
  }
};

exports.updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedBrand = await brandService.updateBrand(id, updateData);
    handleSuccess(res, { data: updatedBrand, message: '品牌更新成功' });
  } catch (error) {
    next(error);
  }
};

exports.deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    await brandService.deleteBrand(id);
    handleSuccess(res, { message: '品牌删除成功' });
  } catch (error) {
    next(error);
  }
};