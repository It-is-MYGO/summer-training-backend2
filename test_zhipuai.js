const { zhipuaiConfig } = require('./config/zhipuai');
const axios = require('axios');

async function testZhipuaiAPI() {
  console.log('🧪 测试智谱AI API配置...');
  console.log('API Key:', zhipuaiConfig.apiKey.substring(0, 10) + '...');
  console.log('API URL:', zhipuaiConfig.apiUrl);
  
  try {
    const headers = {
      "Authorization": `Bearer ${zhipuaiConfig.apiKey}`,
      "Content-Type": "application/json"
    };
    
    const payload = {
      "model": "glm-3-turbo",
      "messages": [
        {
          "role": "user",
          "content": "你好，请简单介绍一下你自己"
        }
      ],
      "temperature": 0.3,
      "max_tokens": 1000
    };
    
    console.log('📤 发送请求到智谱AI...');
    const response = await axios.post(zhipuaiConfig.apiUrl, payload, { headers });
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const content = response.data.choices[0].message.content;
      console.log('✅ 智谱AI响应成功!');
      console.log('🤖 AI回复:', content.substring(0, 100) + '...');
      return true;
    } else {
      console.log('❌ 响应格式异常:', response.data);
      return false;
    }
    
  } catch (error) {
    console.error('❌ 智谱AI API测试失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('网络错误:', error.message);
    }
    return false;
  }
}

// 运行测试
testZhipuaiAPI().then(success => {
  if (success) {
    console.log('🎉 智谱AI配置测试通过！');
  } else {
    console.log('💥 智谱AI配置测试失败！');
  }
  process.exit(success ? 0 : 1);
}); 