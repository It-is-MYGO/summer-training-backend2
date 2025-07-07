const axios = require('axios')
const { zhipuaiConfig } = require('../../../config/zhipuai')

exports.chatWithZhipu = async (message) => {
  const apiKey = zhipuaiConfig.apiKey
  const url = zhipuaiConfig.apiUrl
  const data = {
    model: zhipuaiConfig.models.glm4, // 或 glm3Turbo
    messages: [{ role: 'user', content: message }]
  }
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
  const res = await axios.post(url, data, { headers })
  // 解析智谱AI返回内容
  return res.data.choices?.[0]?.message?.content || 'AI无回复'
}
