const { zhipuaiConfig } = require('../../../config/zhipuai');
const axios = require('axios');

class ZhipuaiService {
  constructor() {
    this.config = zhipuaiConfig;
  }

  // 调用智谱AI API
  async callZhipuaiAPI(messages, model = 'glm-3-turbo', temperature = 0.3) {
    try {
      const headers = {
        "Authorization": `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json"
      };
      
      const payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": this.config.defaultParams.max_tokens,
        "top_p": this.config.defaultParams.top_p
      };
      
      const response = await axios.post(this.config.apiUrl, payload, { headers });
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content.trim();
      } else {
        throw new Error('Invalid response format from ZhipuAI');
      }
    } catch (error) {
      console.error('智谱AI API调用失败:', error.response?.data || error.message);
      throw error;
    }
  }

  // 智能价格分析
  async analyzePriceIntelligence(priceData, category, timeRange) {
    try {
      console.log('🤖 开始智谱AI价格智能分析...');
      
      // 构建分析提示词
      const prompt = this.buildPriceAnalysisPrompt(priceData, category, timeRange);
      
      // 调用智谱AI
      const messages = [
        {
          role: 'system',
          content: '你是一个专业的电商价格分析师，擅长分析商品价格趋势、市场动态和购买建议。请提供准确、实用的分析结果。'
        },
        {
          role: 'user',
          content: prompt
        }
      ];
      
      const analysis = await this.callZhipuaiAPI(messages, this.config.models.glm3Turbo, 0.3);
      
      // 解析AI分析结果
      const insights = this.parseAIInsights(analysis, priceData);
      
      console.log('✅ 智谱AI分析完成，生成洞察数量:', insights.length);
      return insights;
      
    } catch (error) {
      console.error('❌ 智谱AI分析失败:', error);
      throw error;
    }
  }

  // 构建价格分析提示词
  buildPriceAnalysisPrompt(priceData, category, timeRange) {
    const dataSummary = this.summarizePriceData(priceData);
    
    return `
请分析以下电商价格数据，并提供专业的市场洞察和购买建议：

**数据概览：**
- 分析时间范围：最近${timeRange}天
- 商品类别：${category || '全类别'}
- 数据点数量：${priceData.length}天
- 价格记录总数：${priceData.reduce((sum, day) => sum + (day.prices?.length || 0), 0)}条

**价格数据摘要：**
${dataSummary}

**分析要求：**
1. 价格趋势分析：识别价格变化趋势和关键转折点
2. 市场动态评估：分析市场供需关系和竞争态势
3. 异常检测：识别异常价格波动和可能的原因
4. 购买建议：基于价格趋势提供购买时机建议
5. 风险提示：指出潜在的市场风险和注意事项

**输出格式：**
请以JSON格式返回分析结果，包含以下字段：
- insights: 洞察列表，每个洞察包含type(类型)、icon(图标)、message(消息)、priority(优先级1-5)
- summary: 总体分析摘要
- recommendations: 具体建议列表
- risk_level: 风险等级(low/medium/high)

请确保分析结果准确、实用，并适合电商平台用户参考。
    `;
  }

  // 汇总价格数据
  summarizePriceData(priceData) {
    if (!priceData || priceData.length === 0) {
      return '暂无价格数据';
    }

    const allPrices = priceData.flatMap(day => day.prices || []);
    if (allPrices.length === 0) {
      return '暂无有效价格数据';
    }

    const prices = allPrices.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    
    // 按平台分组
    const platformStats = {};
    allPrices.forEach(p => {
      if (!platformStats[p.platform]) {
        platformStats[p.platform] = [];
      }
      platformStats[p.platform].push(p.price);
    });

    let summary = `
- 价格范围：¥${minPrice.toFixed(2)} - ¥${maxPrice.toFixed(2)}
- 平均价格：¥${avgPrice.toFixed(2)}
- 价格标准差：¥${this.calculateStdDev(prices).toFixed(2)}
- 价格波动率：${((this.calculateStdDev(prices) / avgPrice) * 100).toFixed(1)}%
`;

    // 添加平台统计
    Object.keys(platformStats).forEach(platform => {
      const platformPrices = platformStats[platform];
      const platformAvg = platformPrices.reduce((sum, p) => sum + p, 0) / platformPrices.length;
      summary += `- ${platform}平均价：¥${platformAvg.toFixed(2)} (${platformPrices.length}条记录)\n`;
    });

    return summary;
  }

  // 计算标准差
  calculateStdDev(values) {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  // 解析AI分析结果
  parseAIInsights(aiResponse, priceData) {
    try {
      // 尝试解析JSON格式的响应
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.insights && Array.isArray(parsed.insights)) {
          return parsed.insights.map(insight => ({
            id: Date.now() + Math.random(),
            type: insight.type || 'info',
            icon: insight.icon || '🤖',
            message: insight.message,
            priority: insight.priority || 3
          }));
        }
      }

      // 如果JSON解析失败，进行文本解析
      return this.parseTextInsights(aiResponse);
      
    } catch (error) {
      console.warn('AI响应JSON解析失败，使用文本解析:', error);
      return this.parseTextInsights(aiResponse);
    }
  }

  // 文本解析AI响应
  parseTextInsights(aiResponse) {
    const insights = [];
    
    // 提取关键信息
    const lines = aiResponse.split('\n');
    let currentInsight = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 检测价格趋势相关
      if (trimmedLine.includes('上涨') || trimmedLine.includes('上升')) {
        insights.push({
          id: Date.now() + Math.random(),
          type: 'warning',
          icon: '📈',
          message: trimmedLine,
          priority: 4
        });
      }
      // 检测价格下降
      else if (trimmedLine.includes('下降') || trimmedLine.includes('下跌')) {
        insights.push({
          id: Date.now() + Math.random(),
          type: 'info',
          icon: '📉',
          message: trimmedLine,
          priority: 3
        });
      }
      // 检测购买建议
      else if (trimmedLine.includes('建议') || trimmedLine.includes('推荐')) {
        insights.push({
          id: Date.now() + Math.random(),
          type: 'success',
          icon: '💡',
          message: trimmedLine,
          priority: 5
        });
      }
      // 检测风险提示
      else if (trimmedLine.includes('风险') || trimmedLine.includes('注意')) {
        insights.push({
          id: Date.now() + Math.random(),
          type: 'warning',
          icon: '⚠️',
          message: trimmedLine,
          priority: 4
        });
      }
    }
    
    // 如果没有解析到任何洞察，添加默认分析
    if (insights.length === 0) {
      insights.push({
        id: Date.now() + Math.random(),
        type: 'info',
        icon: '🤖',
        message: 'AI已完成价格数据分析，建议关注市场动态',
        priority: 3
      });
    }
    
    return insights;
  }

  // 市场趋势预测
  async predictMarketTrend(priceData, category) {
    try {
      const prompt = `
基于以下历史价格数据，预测未来7天的市场趋势：

**历史数据：**
${this.summarizePriceData(priceData)}

**预测要求：**
1. 价格趋势预测
2. 市场供需变化预测
3. 购买时机建议
4. 风险因素分析

请提供详细的分析和预测结果。
      `;

      const messages = [
        {
          role: 'system',
          content: '你是一个专业的市场分析师，擅长基于历史数据预测市场趋势。'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      return await this.callZhipuaiAPI(messages, this.config.models.glm3Turbo, 0.2);
      
    } catch (error) {
      console.error('市场趋势预测失败:', error);
      throw error;
    }
  }

  // 智能推荐系统
  async generateSmartRecommendations(priceData, userPreferences = {}) {
    try {
      const prompt = `
基于价格数据和用户偏好，生成个性化推荐：

**价格数据：**
${this.summarizePriceData(priceData)}

**用户偏好：**
${JSON.stringify(userPreferences, null, 2)}

**推荐要求：**
1. 最佳购买时机
2. 性价比推荐
3. 风险规避建议
4. 个性化购物策略

请提供具体的推荐方案。
      `;

      const messages = [
        {
          role: 'system',
          content: '你是一个智能推荐系统，能够基于数据和用户偏好提供个性化建议。'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      return await this.callZhipuaiAPI(messages, this.config.models.glm3Turbo, 0.3);
      
    } catch (error) {
      console.error('智能推荐生成失败:', error);
      throw error;
    }
  }
}

module.exports = new ZhipuaiService(); 