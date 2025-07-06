"""
智谱AI大模型商品分类判断模块
"""

import requests
import json
import time
import hashlib
import base64
import hmac
from datetime import datetime
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ZhipuAIClassifier:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
        self.model = "glm-4"  # 使用GLM-4模型
        
        # 分类体系定义
        self.categories = [
            '手机数码', '服装鞋帽', '运动户外', '家居生活', '食品饮料',
            '母婴用品', '美妆护肤', '图书音像', '汽车用品', '医药保健'
        ]
        
        # 分类提示词模板
        self.classification_prompt = """
你是一个专业的商品分类专家。请根据商品标题和品牌信息，将商品准确分类到以下类别中：

分类选项：
1. 手机数码 - 手机、平板、电脑、数码产品等
2. 服装鞋帽 - 衣服、鞋子、帽子、包包等
3. 运动户外 - 运动鞋、运动服、户外装备等
4. 家居生活 - 家具、家居用品、装饰品等
5. 食品饮料 - 零食、饮料、食品等
6. 母婴用品 - 婴儿用品、儿童用品等
7. 美妆护肤 - 化妆品、护肤品等
8. 图书音像 - 书籍、音像制品等
9. 汽车用品 - 汽车配件、用品等
10. 医药保健 - 药品、保健品等

请严格按照以下JSON格式返回结果：
{
    "category": "分类名称",
    "confidence": 0.95,
    "reason": "分类理由"
}

商品信息：
标题：{title}
品牌：{brand}

请分析并返回分类结果：
"""

    def _generate_signature(self, api_key, timestamp):
        """生成API签名"""
        try:
            # 解析API Key
            id, secret = api_key.split('.')
            
            # 生成签名
            signature_origin = f"host: open.bigmodel.cn\ndate: {timestamp}\nPOST /api/paas/v4/chat/completions HTTP/1.1"
            signature_sha = hmac.new(
                secret.encode('utf-8'),
                signature_origin.encode('utf-8'),
                digestmod=hashlib.sha256
            ).digest()
            
            signature = base64.b64encode(signature_sha).decode('utf-8')
            authorization_origin = f'api_key="{id}", algorithm="hmac-sha256", headers="host date request-line", signature="{signature}"'
            authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode('utf-8')
            
            return authorization
        except Exception as e:
            logger.error(f"生成签名失败: {e}")
            return None

    def classify_product(self, title, brand=None, retry_count=3):
        """
        使用智谱AI对商品进行分类
        
        Args:
            title (str): 商品标题
            brand (str): 品牌信息
            retry_count (int): 重试次数
            
        Returns:
            dict: 分类结果
        """
        if not title:
            return {
                "category": "未分类",
                "confidence": 0.0,
                "reason": "商品标题为空"
            }
        
        # 构建请求数据
        timestamp = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')
        authorization = self._generate_signature(self.api_key, timestamp)
        
        if not authorization:
            return {
                "category": "未分类",
                "confidence": 0.0,
                "reason": "API签名生成失败"
            }
        
        # 构建提示词
        prompt = self.classification_prompt.format(
            title=title,
            brand=brand or "未知品牌"
        )
        
        # 请求数据
        data = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.1,  # 低温度确保结果稳定
            "max_tokens": 500
        }
        
        headers = {
            "Authorization": authorization,
            "Content-Type": "application/json",
            "Date": timestamp
        }
        
        # 发送请求
        for attempt in range(retry_count):
            try:
                response = requests.post(
                    self.base_url,
                    headers=headers,
                    json=data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # 解析AI返回的内容
                    ai_response = result.get('choices', [{}])[0].get('message', {}).get('content', '')
                    
                    # 尝试解析JSON响应
                    try:
                        classification_result = json.loads(ai_response)
                        return {
                            "category": classification_result.get("category", "未分类"),
                            "confidence": classification_result.get("confidence", 0.0),
                            "reason": classification_result.get("reason", "AI分类结果"),
                            "ai_response": ai_response
                        }
                    except json.JSONDecodeError:
                        # 如果JSON解析失败，尝试从文本中提取分类
                        category = self._extract_category_from_text(ai_response)
                        return {
                            "category": category,
                            "confidence": 0.7,
                            "reason": "AI分类结果（文本解析）",
                            "ai_response": ai_response
                        }
                
                else:
                    logger.warning(f"API请求失败，状态码: {response.status_code}, 响应: {response.text}")
                    
            except requests.exceptions.RequestException as e:
                logger.error(f"请求异常 (尝试 {attempt + 1}/{retry_count}): {e}")
                if attempt < retry_count - 1:
                    time.sleep(2 ** attempt)  # 指数退避
                continue
            except Exception as e:
                logger.error(f"未知错误 (尝试 {attempt + 1}/{retry_count}): {e}")
                if attempt < retry_count - 1:
                    time.sleep(2 ** attempt)
                continue
        
        # 所有重试都失败，返回默认结果
        return {
            "category": "未分类",
            "confidence": 0.0,
            "reason": "AI分类服务不可用"
        }

    def _extract_category_from_text(self, text):
        """从AI返回的文本中提取分类"""
        text_lower = text.lower()
        
        # 简单的关键词匹配
        category_keywords = {
            '手机数码': ['手机', '数码', '电脑', '平板', 'iphone', '华为', '小米'],
            '服装鞋帽': ['衣服', '鞋子', '帽子', '服装', '鞋帽'],
            '运动户外': ['运动', '户外', '健身', '跑步'],
            '家居生活': ['家居', '家具', '生活'],
            '食品饮料': ['食品', '饮料', '零食', '食品'],
            '母婴用品': ['母婴', '婴儿', '儿童'],
            '美妆护肤': ['美妆', '护肤', '化妆品'],
            '图书音像': ['图书', '书籍', '音像'],
            '汽车用品': ['汽车', '车用', '汽配'],
            '医药保健': ['医药', '保健', '药品']
        }
        
        for category, keywords in category_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    return category
        
        return "未分类"

    def batch_classify(self, products, batch_size=10):
        """
        批量分类商品
        
        Args:
            products (list): 商品列表，每个商品包含title和brand字段
            batch_size (int): 批次大小
            
        Returns:
            list: 分类结果列表
        """
        results = []
        
        for i in range(0, len(products), batch_size):
            batch = products[i:i + batch_size]
            logger.info(f"处理批次 {i//batch_size + 1}, 商品数量: {len(batch)}")
            
            for product in batch:
                result = self.classify_product(
                    title=product.get('title', ''),
                    brand=product.get('brand', '')
                )
                results.append({
                    **product,
                    'ai_category': result['category'],
                    'ai_confidence': result['confidence'],
                    'ai_reason': result['reason']
                })
                
                # 添加延迟避免API限制
                time.sleep(1)
        
        return results

def test_ai_classifier():
    """测试AI分类器"""
    # 请替换为您的实际API Key
    api_key = "da8d5f3ab93340978cc36de720635a95.1MzyRLcNXkvVOGpD"
    
    classifier = ZhipuAIClassifier(api_key)
    
    # 测试用例
    test_cases = [
        {"title": "iPhone 14 Pro Max 256GB 深空黑色 智能手机", "brand": "苹果"},
        {"title": "李宁运动鞋男2024新款跑步鞋", "brand": "李宁"},
        {"title": "华为手机壳iPhone14保护套", "brand": "华为"},
        {"title": "耐克篮球鞋Nike Air Jordan", "brand": "耐克"},
        {"title": "小米平板电脑iPad Pro", "brand": "小米"},
        {"title": "安踏运动服套装", "brand": "安踏"},
        {"title": "手机支架桌面懒人支架", "brand": "未知"},
        {"title": "华为Mate60 Pro手机", "brand": "华为"},
        {"title": "李宁运动裤男", "brand": "李宁"},
        {"title": "苹果iPhone15手机壳", "brand": "苹果"},
    ]
    
    print("🧪 测试智谱AI分类器...")
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n测试 {i}: {test_case['title']}")
        result = classifier.classify_product(
            title=test_case['title'],
            brand=test_case['brand']
        )
        print(f"AI分类结果: {result['category']} (置信度: {result['confidence']:.2f})")
        print(f"分类理由: {result['reason']}")

if __name__ == "__main__":
    test_ai_classifier() 