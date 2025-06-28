const userService = require('../services/user.service');
const { handleSuccess } = require('../../../lib/utils/response');

exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const users = await userService.getAllUsers(page, limit, search);
    handleSuccess(res, { data: users });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedUser = await userService.updateUser(id, updateData);
    handleSuccess(res, { data: updatedUser, message: '用户更新成功' });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);
    handleSuccess(res, { message: '用户删除成功' });
  } catch (error) {
    next(error);
  }
};