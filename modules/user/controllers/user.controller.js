const userRepository = require('../repositories/user.repository');
const logService = require('../../log/services/log.service'); // 路径根据实际项目结构调整

// 获取所有用户
exports.getAllUsers = async (req, res) => {
  try {
    const users = await userRepository.getAllUsers();
    console.log('users:', users); // 输出查询到的用户数据
    res.json({ data: users });
  } catch (err) {
    console.error('获取用户失败:', err); // 输出详细错误信息
    res.status(500).json({ message: '获取用户失败', error: err.message, stack: err.stack });
  }
};

// 更新用户角色/状态
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { isadmin, status } = req.body;
  try {
    await userRepository.updateUserAdminStatus(id, { isadmin, status });
    // 如果是被封禁，写日志
    if (status === 'banned') {
      await logService.addUserLog(
        id,
        'ban',
        'success',
        req.ip,
        req.headers['user-agent']
      );
    }
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ message: '更新失败' });
  }
};

// 删除用户
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await userRepository.deleteUser(id);
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ message: '删除失败' });
  }
};

// 获取用户活跃度分布
exports.getActivityDistribution = async (req, res) => {
  try {
    const dist = await userRepository.getActivityDistribution();
    res.json({
      data: [
        { name: '高活跃用户', value: dist.high },
        { name: '中等活跃用户', value: dist.medium },
        { name: '低活跃用户', value: dist.low },
        { name: '新用户', value: dist.new_user }
      ]
    });
  } catch (err) {
    res.status(500).json({ message: '获取活跃度分布失败', error: err.message });
  }
};

// 获取用户分页数据
exports.getUsersPaged = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  try {
    const { rows, total } = await userRepository.getUsersPaged(page, pageSize);
    res.json({ data: rows, total });
  } catch (err) {
    res.status(500).json({ message: '获取用户失败', error: err.message });
  }
}; 