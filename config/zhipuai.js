// 智谱AI配置
const zhipuaiConfig = {
  // 从环境变量获取API密钥，如果没有则使用默认值
  apiKey: process.env.ZHIPUAI_API_KEY || 'da8d5f3ab93340978cc36de720635a95.1MzyRLcNXkvVOGpD',
  
  // API URL
  apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  
  // 模型配置
  models: {
    // GLM-4 模型（推荐用于复杂分析）
    glm4: 'glm-4',
    // GLM-3-Turbo 模型（适合一般对话）
    glm3Turbo: 'glm-3-turbo',
    // GLM-4V 模型（支持多模态）
    glm4v: 'glm-4v'
  },
  
  // 默认参数
  defaultParams: {
    temperature: 0.3,
    max_tokens: 2000,
    top_p: 0.8
  }
};

module.exports = {
  zhipuaiConfig
}; 