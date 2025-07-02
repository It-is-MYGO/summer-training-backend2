const logToTerminal = (req, res) => {
  const { msg, data } = req.body;
  console.log('[前端日志]', msg, data);
  res.json({ code: 0, message: 'logged' });
};

module.exports = { logToTerminal }; 