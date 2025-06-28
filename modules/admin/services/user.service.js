const userRepository = require('../repositories/user.repository');

exports.getAllUsers = async (page, limit, search) => {
  const offset = (page - 1) * limit;
  return await userRepository.findAndCountAll(offset, limit, search);
};

exports.updateUser = async (id, updateData) => {
  return await userRepository.update(id, updateData);
};

exports.deleteUser = async (id) => {
  return await userRepository.delete(id);
};