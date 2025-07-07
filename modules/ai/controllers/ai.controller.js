const aiService = require('../services/ai.service')

exports.chat = async (req, res) => {
  const { message } = req.body
  if (!message) return res.status(400).json({ reply: '消息不能为空' })
  try {
    const reply = await aiService.chatWithZhipu(message)
    res.json({ reply })
  } catch (e) {
    res.status(500).json({ reply: 'AI服务异常' })
  }
}
