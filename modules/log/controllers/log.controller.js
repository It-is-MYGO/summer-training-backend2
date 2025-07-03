const logService = require('../services/log.service');

function getClientIp(req) {
  let ip = req.ip || req.connection?.remoteAddress || '';
  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
}

const logToTerminal = (req, res) => {
  const { msg, data } = req.body;
  console.log('[前端日志]', msg, data);
  res.json({ code: 0, message: 'logged' });
};

// 获取用户日志列表
const getUserLogs = async (req, res) => {
  try {
    const { userId, action, page = 1, pageSize = 20 } = req.query;
    const { rows, total } = await logService.getUserLogs({ userId, action, page, pageSize });
    res.json({ data: rows, total });
  } catch (err) {
    console.error('获取用户日志失败:', err);
    res.status(500).json({ message: '获取用户日志失败', error: err.message });
  }
};

// 新增用户日志（自动获取ip和userAgent）
const addUserLog = async (req, res) => {
  try {
    const { userId, action, status, userAgent } = req.body;
    const ip = getClientIp(req);
    const ua = userAgent || req.headers['user-agent'] || '';
    await logService.addUserLog(userId, action, status, ip, ua);
    res.json({ message: '日志添加成功' });
  } catch (err) {
    console.error('添加用户日志失败:', err);
    res.status(500).json({ message: '添加用户日志失败', error: err.message });
  }
};

module.exports = { logToTerminal, getUserLogs, addUserLog }; 