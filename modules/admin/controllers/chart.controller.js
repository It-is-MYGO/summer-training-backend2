const chartService = require('../services/chart.service');
const { handleSuccess } = require('../../../lib/utils/response');
exports.getUserActivityStats = async (req, res, next) => {
  try {
    const stats = await chartService.getUserActivityStats();
    handleSuccess(res, { data: stats });
  } catch (error) {
    next(error);
  }
};

exports.getProductCategoryStats = async (req, res, next) => {
  try {
    const stats = await chartService.getProductCategoryStats();
    handleSuccess(res, { data: stats });
  } catch (error) {
    next(error);
  }
};

exports.getPriceTrendStats = async (req, res, next) => {
  try {
    const stats = await chartService.getPriceTrendStats();
    handleSuccess(res, { data: stats });
  } catch (error) {
    next(error);
  }
};

exports.getPlatformComparisonStats = async (req, res, next) => {
  try {
    const stats = await chartService.getPlatformComparisonStats();
    handleSuccess(res, { data: stats });
  } catch (error) {
    next(error);
  }
};