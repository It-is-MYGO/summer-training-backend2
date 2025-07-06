"""
智谱AI配置文件
"""

# 智谱AI API配置
ZHIPU_CONFIG = {
    "url": "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    "api_key": "da8d5f3ab93340978cc36de720635a95.1MzyRLcNXkvVOGpD",
    "model": "glm-4",
    "temperature": 0.1,
    "max_tokens": 500,
    "timeout": 30,
    "retry_count": 3
}

# 分类体系定义
CATEGORIES = [
    '手机数码', '服装鞋帽', '运动户外', '家居生活', '食品饮料',
    '母婴用品', '美妆护肤', '图书音像', '汽车用品', '医药保健'
]

# 分类提示词模板
CLASSIFICATION_PROMPT_TEMPLATE = """
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

# AI分类配置
AI_CLASSIFICATION_CONFIG = {
    "min_confidence": 0.7,  # 最小置信度阈值
    "fallback_to_traditional": True,  # 是否在AI失败时回退到传统方法
    "enable_logging": True,  # 是否启用日志记录
    "batch_size": 10,  # 批量处理大小
    "delay_between_requests": 1,  # 请求间隔（秒）
}

# 性能监控配置
PERFORMANCE_CONFIG = {
    "enable_monitoring": True,
    "log_slow_requests": True,
    "slow_request_threshold": 10,  # 慢请求阈值（秒）
    "max_concurrent_requests": 5,  # 最大并发请求数
}

# 错误处理配置
ERROR_HANDLING_CONFIG = {
    "max_retries": 3,
    "retry_delay": 2,  # 重试延迟（秒）
    "exponential_backoff": True,  # 是否使用指数退避
    "log_errors": True,
}

def get_config():
    """获取完整配置"""
    return {
        "zhipu": ZHIPU_CONFIG,
        "categories": CATEGORIES,
        "prompt_template": CLASSIFICATION_PROMPT_TEMPLATE,
        "ai_classification": AI_CLASSIFICATION_CONFIG,
        "performance": PERFORMANCE_CONFIG,
        "error_handling": ERROR_HANDLING_CONFIG
    }

def update_api_key(new_api_key):
    """更新API Key"""
    global ZHIPU_CONFIG
    ZHIPU_CONFIG["api_key"] = new_api_key

def update_model(new_model):
    """更新模型"""
    global ZHIPU_CONFIG
    ZHIPU_CONFIG["model"] = new_model

def update_confidence_threshold(new_threshold):
    """更新置信度阈值"""
    global AI_CLASSIFICATION_CONFIG
    AI_CLASSIFICATION_CONFIG["min_confidence"] = new_threshold 