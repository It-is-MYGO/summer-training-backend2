const chartRepository = require('../repositories/chart.repository');

exports.getUserActivityStats = async () => {
  return await chartRepository.getUserActivityStats();
};

exports.getProductCategoryStats = async () => {
  return await chartRepository.getProductCategoryStats();
};

exports.getPriceTrendStats = async () => {
  return await chartRepository.getPriceTrendStats();
};

exports.getPlatformComparisonStats = async () => {
  return await chartRepository.getPlatformComparisonStats();
};