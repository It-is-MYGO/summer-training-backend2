from lxml import etree
from time import sleep
from app01.utils.utils_func import draw_num, avoid_check
import time
import random
import csv
from datetime import datetime
import re
import pymysql
import requests
import json
import hashlib
import base64
import hmac
from datetime import datetime
import logging
from concurrent.futures import ThreadPoolExecutor
import pickle
import os
from collections import defaultdict

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 改进的商品分类关键词映射 - 添加权重和排除词
CATEGORY_KEYWORDS = {
    '手机数码': {
        'keywords': ['手机', 'iPhone', '华为', '小米', 'OPPO', 'vivo', '三星', '魅族', '一加', 'realme', 'iQOO', '荣耀', '红米', '苹果', '智能手机', '平板', 'iPad', '电脑', '笔记本', 'MacBook', 'ThinkPad', '戴尔', '联想', '华硕', '惠普', '数码', '相机', '单反', '微单', '摄像机', '耳机', '音响', '蓝牙耳机', '无线耳机', '充电器', '数据线', '充电宝', '移动电源', '智能手表', '手环', '数码产品'],
        'exclude': ['手机壳', '手机膜', '手机支架', '手机套', '手机贴膜', '手机保护套'],
        'weight': 1.0
    },
    '服装鞋帽': {
        'keywords': ['衣服', '上衣', '裤子', '裙子', '外套', '羽绒服', '棉服', '卫衣', 'T恤', '衬衫', '牛仔裤', '运动裤', '休闲裤', '西装', '礼服', '内衣', '内裤', '袜子', '鞋子', '运动鞋', '跑鞋', '篮球鞋', '足球鞋', '帆布鞋', '皮鞋', '凉鞋', '拖鞋', '靴子', '帽子', '棒球帽', '鸭舌帽', '毛线帽', '围巾', '手套', '腰带', '包包', '背包', '手提包', '钱包', '双肩包', '服装', '男装', '女装', '童装', '时尚'],
        'exclude': ['衣架', '晾衣架', '衣柜', '鞋柜', '衣帽架'],
        'weight': 1.0
    },
    '运动户外': {
        'keywords': ['运动', '健身', '跑步', '篮球', '足球', '羽毛球', '乒乓球', '网球', '游泳', '瑜伽', '户外', '登山', '徒步', '露营', '钓鱼', '骑行', '滑雪', '滑板', '轮滑', '健身器材', '哑铃', '跑步机', '动感单车', '瑜伽垫', '运动服', '运动裤', '运动袜', '护具', '护膝', '护腕', '护肘', '头盔', '手套', '运动装备', '户外装备', '体育用品'],
        'exclude': ['运动饮料', '运动营养品', '运动补剂'],
        'weight': 1.2  # 运动品牌商品权重更高
    },
    '家居生活': {
        'keywords': ['家具', '沙发', '床', '桌子', '椅子', '柜子', '衣柜', '书柜', '鞋柜', '茶几', '电视柜', '餐桌', '书桌', '办公桌', '床垫', '枕头', '被子', '床单', '被套', '枕套', '毛巾', '浴巾', '浴袍', '家居', '家装', '装饰', '摆件', '花瓶', '相框', '地毯', '窗帘', '灯具', '台灯', '吊灯', '壁灯', '吸顶灯', '家居用品'],
        'exclude': ['家具清洁剂', '家具维修', '家具安装'],
        'weight': 1.0
    },
    '食品饮料': {
        'keywords': ['零食', '饼干', '薯片', '糖果', '巧克力', '坚果', '瓜子', '花生', '核桃', '杏仁', '腰果', '开心果', '饮料', '可乐', '雪碧', '果汁', '奶茶', '咖啡', '茶', '矿泉水', '纯净水', '牛奶', '酸奶', '面包', '蛋糕', '月饼', '粽子', '方便面', '火腿肠', '罐头', '调味品', '酱油', '醋', '盐', '糖', '油', '米', '面', '面条', '食品', '零食', '小吃', '饮品'],
        'exclude': ['食品包装', '食品加工', '食品添加剂'],
        'weight': 1.0
    },
    '母婴用品': {
        'keywords': ['尿不湿', '纸尿裤', '湿巾', '奶瓶', '奶嘴', '吸奶器', '婴儿车', '婴儿床', '摇篮', '玩具', '积木', '拼图', '毛绒玩具', '益智玩具', '早教', '绘本', '故事书', '婴儿服', '连体衣', '爬服', '围嘴', '口水巾', '润肤露', '护臀膏', '母婴', '婴儿', '宝宝', '儿童', '幼儿', '母婴用品'],
        'exclude': ['成人用品', '成人服装', '成人玩具'],
        'weight': 1.0
    },
    '美妆护肤': {
        'keywords': ['护肤品', '洗面奶', '爽肤水', '精华液', '面霜', '乳液', '眼霜', '面膜', '防晒霜', '隔离霜', '粉底液', 'BB霜', 'CC霜', '遮瑕膏', '散粉', '定妆粉', '腮红', '眼影', '眼线笔', '睫毛膏', '眉笔', '口红', '唇膏', '唇彩', '指甲油', '香水', '护发素', '发膜', '精油', '美容仪', '化妆刷', '美妆蛋', '美妆', '护肤', '化妆品', '彩妆'],
        'exclude': ['美容院', '美容服务', '美容设备'],
        'weight': 1.0
    },
    '图书音像': {
        'keywords': ['图书', '小说', '文学', '历史', '哲学', '心理学', '经济学', '管理学', '计算机', '编程', '技术', '教材', '教辅', '考试', '英语', '数学', '语文', '物理', '化学', '生物', '地理', '政治', '音乐', 'CD', 'DVD', '蓝光', '电影', '电视剧', '纪录片', '动画', '游戏', '手柄', '键盘', '鼠标', '显示器', '音箱', '书籍', '杂志', '音像制品'],
        'exclude': ['游戏机', '游戏设备', '游戏主机'],
        'weight': 1.0
    },
    '汽车用品': {
        'keywords': ['汽车', '轮胎', '机油', '机滤', '空滤', '汽滤', '刹车片', '刹车盘', '火花塞', '电瓶', '蓄电池', '雨刷', '雨刮器', '车灯', '大灯', '尾灯', '转向灯', '雾灯', '车膜', '贴膜', '脚垫', '座套', '方向盘套', '挂件', '摆件', '导航', '行车记录仪', '倒车雷达', '倒车影像', '车载充电器', '车载冰箱', '车载吸尘器', '汽车配件', '汽配'],
        'exclude': ['汽车', '摩托车', '电动车', '自行车'],
        'weight': 1.0
    },
    '医药保健': {
        'keywords': ['药品', '感冒药', '退烧药', '消炎药', '止痛药', '维生素', '钙片', '鱼油', '蛋白粉', '保健品', '营养品', '减肥药', '减肥茶', '减肥产品', '医疗器械', '血压计', '血糖仪', '体温计', '听诊器', '按摩器', '按摩椅', '按摩垫', '理疗仪', '艾灸', '拔罐', '刮痧', '针灸', '中药', '中药材', '中成药', '西药', '处方药', '非处方药', '医药', '保健', '医疗'],
        'exclude': ['医院', '诊所', '医疗服务', '医疗设备'],
        'weight': 1.0
    }
}

# 品牌分类映射
BRAND_CATEGORY_MAP = {
    '手机数码': ['苹果', '华为', '小米', 'OPPO', 'vivo', '三星', '魅族', '一加', 'realme', 'iQOO', '荣耀', '红米', '联想', '戴尔', '华硕', '惠普', 'ThinkPad', 'MacBook', 'iPad'],
    '运动户外': ['李宁', '耐克', '阿迪达斯', '安踏', '特步', '鸿星尔克', '匹克', '乔丹', '彪马', '斐乐', '匡威', '万斯', '新百伦', '斯凯奇'],
    '美妆护肤': ['兰蔻', '雅诗兰黛', '欧莱雅', '资生堂', 'SK-II', '海蓝之谜', '倩碧', '科颜氏', '悦诗风吟', '雪花秀'],
    '食品饮料': ['可口可乐', '百事可乐', '娃哈哈', '农夫山泉', '康师傅', '统一', '蒙牛', '伊利', '光明', '三元'],
    '母婴用品': ['花王', '帮宝适', '好奇', '妈咪宝贝', '贝亲', '飞利浦', '新安怡', '美德乐', '好孩子', '贝贝怡'],
    '家居生活': ['宜家', '全友', '顾家', '索菲亚', '欧派', '志邦', '金牌', '皮阿诺', '好莱客', '尚品宅配'],
    '汽车用品': ['米其林', '普利司通', '固特异', '邓禄普', '马牌', '倍耐力', '佳通', '玲珑', '朝阳', '正新'],
    '医药保健': ['同仁堂', '云南白药', '片仔癀', '东阿阿胶', '九芝堂', '太极', '哈药', '华北制药', '东北制药', '新华制药']
}

# 智谱AI配置
ZHIPU_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
ZHIPU_API_KEY = "da8d5f3ab93340978cc36de720635a95.1MzyRLcNXkvVOGpD"

# 分类缓存文件
CACHE_FILE = 'category_cache.pkl'
# 批量分类大小
BATCH_SIZE = 10
# 导入分类配置
try:
    from .classification_config import get_classification_strategy
    CLASSIFICATION_STRATEGY = get_classification_strategy()
except ImportError:
    # 默认配置
    CLASSIFICATION_STRATEGY = {
        'use_cache': True,           # 是否使用缓存
        'use_batch_ai': True,        # 是否使用批量AI分类
        'use_traditional_first': True,  # 是否优先使用传统方法
        'ai_confidence_threshold': 0.7,  # AI置信度阈值
        'max_concurrent_requests': 5,    # 最大并发请求数
        'cache_expire_days': 7       # 缓存过期天数
    }

class CategoryClassifier:
    """智能分类器 - 支持缓存和优化策略"""
    
    def __init__(self):
        self.cache = self._load_cache()
        self.executor = ThreadPoolExecutor(max_workers=CLASSIFICATION_STRATEGY['max_concurrent_requests'])
    
    def _load_cache(self):
        """加载分类缓存"""
        if not CLASSIFICATION_STRATEGY['use_cache']:
            return {}
        
        try:
            if os.path.exists(CACHE_FILE):
                with open(CACHE_FILE, 'rb') as f:
                    cache_data = pickle.load(f)
                    # 检查缓存是否过期
                    if 'timestamp' in cache_data:
                        cache_age = (datetime.now() - cache_data['timestamp']).days
                        if cache_age < CLASSIFICATION_STRATEGY['cache_expire_days']:
                            return cache_data.get('categories', {})
                    return {}
        except Exception as e:
            logger.warning(f"加载缓存失败: {e}")
        return {}
    
    def _save_cache(self):
        """保存分类缓存"""
        if not CLASSIFICATION_STRATEGY['use_cache']:
            return
        
        try:
            cache_data = {
                'categories': self.cache,
                'timestamp': datetime.now()
            }
            with open(CACHE_FILE, 'wb') as f:
                pickle.dump(cache_data, f)
        except Exception as e:
            logger.warning(f"保存缓存失败: {e}")
    
    def _get_cache_key(self, title, brand=None):
        """生成缓存键"""
        key_text = f"{title.lower().strip()}_{brand.lower().strip() if brand else 'unknown'}"
        return hashlib.md5(key_text.encode()).hexdigest()
    
    def classify_single(self, title, brand=None):
        """单个商品分类 - 智能策略"""
        if not title:
            return '未分类'
        
        # 1. 检查缓存
        cache_key = self._get_cache_key(title, brand)
        if cache_key in self.cache:
            logger.info(f"缓存命中: {title[:30]}...")
            return self.cache[cache_key]
        
        # 2. 策略选择
        if CLASSIFICATION_STRATEGY['use_traditional_first']:
            # 优先使用传统方法
            category = get_category_from_title(title, brand)
            if category != '未分类':
                self.cache[cache_key] = category
                return category
        
        # 3. 使用AI分类（单个）
        try:
            category = classify_with_ai(title, brand)
            self.cache[cache_key] = category
            return category
        except Exception as e:
            logger.warning(f"AI分类失败，使用传统方法: {e}")
            category = get_category_from_title(title, brand)
            self.cache[cache_key] = category
            return category
    
    def classify_batch_sync(self, items):
        """同步批量分类 - 优化版本"""
        if not CLASSIFICATION_STRATEGY['use_batch_ai']:
            return [self.classify_single(item['title'], item.get('brand')) for item in items]
        
        # 过滤出需要AI分类的商品
        ai_items = []
        results = []
        
        for item in items:
            cache_key = self._get_cache_key(item['title'], item.get('brand'))
            if cache_key in self.cache:
                results.append(self.cache[cache_key])
            else:
                ai_items.append((len(results), item))
                results.append(None)  # 占位符
        
        if not ai_items:
            return results
        
        # 批量AI分类 - 使用线程池并发处理
        try:
            batch_results = self._batch_ai_classify_sync(ai_items)
            for idx, category in batch_results:
                results[idx] = category
                # 更新缓存
                cache_key = self._get_cache_key(ai_items[idx][1]['title'], ai_items[idx][1].get('brand'))
                self.cache[cache_key] = category
        except Exception as e:
            logger.error(f"批量AI分类失败: {e}")
            # 回退到传统方法
            for idx, item in ai_items:
                category = get_category_from_title(item['title'], item.get('brand'))
                results[idx] = category
                cache_key = self._get_cache_key(item['title'], item.get('brand'))
                self.cache[cache_key] = category
        
        return results
    
    def _batch_ai_classify_sync(self, items):
        """同步批量AI分类实现"""
        if not items:
            return []
        
        # 使用线程池并发处理AI请求
        futures = []
        for i, item in enumerate(items):
            future = self.executor.submit(self._single_ai_classify, item[1]['title'], item[1].get('brand'), i)
            futures.append((i, future))
        
        # 收集结果
        batch_results = []
        for idx, future in futures:
            try:
                category = future.result(timeout=30)
                batch_results.append((items[idx][0], category))
            except Exception as e:
                logger.warning(f"AI请求失败 (索引 {idx}): {e}")
                category = get_category_from_title(items[idx][1]['title'], items[idx][1].get('brand'))
                batch_results.append((items[idx][0], category))
        
        return batch_results
    
    def _single_ai_classify(self, title, brand, index):
        """单个AI分类请求"""
        try:
            # 简化的AI分类调用
            return classify_with_ai(title, brand)
        except Exception as e:
            logger.error(f"AI分类失败 (索引 {index}): {e}")
            raise
    
    def __del__(self):
        """析构时保存缓存"""
        self._save_cache()

# 全局分类器实例
classifier = CategoryClassifier()

def clean_category(category):
    """去除前缀数字和点，保留纯分类名"""
    if not category:
        return '未分类'
    return re.sub(r'^[0-9]+[.．、\s]*', '', str(category)).strip()

def classify_with_ai_optimized(title, brand=None):
    """优化后的AI分类函数"""
    return clean_category(classifier.classify_single(title, brand))

def classify_batch(items):
    """批量分类接口"""
    return classifier.classify_batch_sync(items)

def get_category_from_title(title, brand=None):
    """
    改进的商品分类识别 - 支持品牌优先和排除词过滤
    """
    if not title:
        return '未分类'
    
    title_lower = title.lower()
    
    # 1. 品牌优先分类
    if brand:
        brand_lower = brand.lower()
        for category, brands in BRAND_CATEGORY_MAP.items():
            for brand_keyword in brands:
                if brand_keyword.lower() in brand_lower:
                    return category
    
    # 2. 排除词检查
    for category, config in CATEGORY_KEYWORDS.items():
        for exclude_word in config['exclude']:
            if exclude_word.lower() in title_lower:
                return '未分类'  # 如果包含排除词，直接返回未分类
    
    # 3. 关键词评分
    category_scores = {}
    
    for category, config in CATEGORY_KEYWORDS.items():
        score = 0
        for keyword in config['keywords']:
            if keyword.lower() in title_lower:
                # 完整匹配加分
                if keyword.lower() in title_lower.split():
                    score += 3
                else:
                    score += 1
        
        # 应用权重
        score *= config['weight']
        
        if score > 0:
            category_scores[category] = score
    
    # 4. 返回得分最高的分类
    if category_scores:
        best_category = max(category_scores.items(), key=lambda x: x[1])[0]
        return clean_category(best_category)
    
    return '未分类'

def _generate_zhipu_signature(api_key, timestamp):
    """生成智谱AI API签名 - 直接使用API Key"""
    try:
        return f"Bearer {api_key}"
    except Exception as e:
        logger.error(f"生成智谱AI签名失败: {e}")
        return None

def classify_with_ai(title, brand=None):
    """
    使用智谱AI对商品进行分类
    
    Args:
        title (str): 商品标题
        brand (str): 品牌信息
        
    Returns:
        str: 分类结果
    """
    if not title:
        return '未分类'
    
    try:
        # 构建请求数据
        timestamp = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')
        authorization = _generate_zhipu_signature(ZHIPU_API_KEY, timestamp)
        
        if not authorization:
            return '未分类'
        
        # 分类提示词
        prompt = f"""
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
{{
    "category": "分类名称",
    "confidence": 0.95,
    "reason": "分类理由"
}}

商品信息：
标题：{title}
品牌：{brand or '未知品牌'}

请分析并返回分类结果：
"""
        
        # 请求数据
        data = {
            "model": "glm-4",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.1,
            "max_tokens": 500
        }
        
        headers = {
            "Authorization": authorization,
            "Content-Type": "application/json",
            "Date": timestamp
        }
        
        # 发送请求
        response = requests.post(
            ZHIPU_URL,
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            ai_response = result.get('choices', [{}])[0].get('message', {}).get('content', '')
            
            # 尝试解析JSON响应
            try:
                classification_result = json.loads(ai_response)
                category = classification_result.get("category", "未分类")
                confidence = classification_result.get("confidence", 0.0)
                
                # 如果置信度低于0.7，使用传统方法
                if confidence < 0.7:
                    logger.info(f"AI置信度较低({confidence:.2f})，使用传统分类方法")
                    return get_category_from_title(title, brand)
                
                logger.info(f"AI分类成功: {category} (置信度: {confidence:.2f})")
                return clean_category(category)
                
            except json.JSONDecodeError:
                logger.warning("AI返回格式错误，使用传统分类方法")
                return get_category_from_title(title, brand)
        
        else:
            logger.warning(f"智谱AI请求失败，状态码: {response.status_code}")
            return get_category_from_title(title, brand)
            
    except Exception as e:
        logger.error(f"智谱AI分类异常: {e}")
        return get_category_from_title(title, brand)

def get_category_from_page(tree, page_type):
    """
    从页面元素中提取分类信息
    """
    try:
        if page_type == "product":
            # 尝试从面包屑导航获取分类
            breadcrumb = tree.xpath('//div[@class="breadcrumb"]//text()')
            if breadcrumb:
                breadcrumb_text = ''.join(breadcrumb).strip()
                # 从面包屑中提取分类
                for category in CATEGORY_KEYWORDS.keys():
                    if category in breadcrumb_text:
                        return category
            
            # 尝试从页面标题获取分类
            page_title = tree.xpath('//title/text()')
            if page_title:
                title_text = page_title[0].strip()
                return get_category_from_title(title_text)
        
        return '未分类'
    except Exception as e:
        print(f"提取页面分类时出错: {str(e)}")
        return '未分类'

def crawler(goods_word):
    goods_info = []
    bro = avoid_check()
    bro.get('https://suning.com/')
    
    # 标签定位
    search_input = bro.find_element('id', value='searchKeywords')
    # 搜索关键词
    search_input.send_keys(goods_word)
    # 点击搜索按钮
    btn = bro.find_element('id', value='searchSubmit')
    btn.submit()
    sleep(random.uniform(2, 4))
    
    # 检查页面类型
    page_type = "product"  # 默认商品页
    if "brand.suning.com" in bro.current_url:
        page_type = "brand"
    
    # 执行滚动加载
    for i in range(1, 3):
        bro.execute_script('window.scrollTo(0,document.body.scrollHeight)')
        sleep(random.uniform(2, 3))
    
    # 数据解析
    tree = etree.HTML(bro.page_source)
    
    # 根据页面类型获取商品列表
    if page_type == "product":
        goods_li_list = tree.xpath('//div[@id="product-list"]/ul/li')
    else:  # 品牌页
        goods_li_list = tree.xpath('//div[contains(@class, "item-list")]/ul/li')
    
    # 翻页处理
    for i in range(1, 3):
        try:
            if page_type == "product":
                btn_next = bro.find_element('id', value='nextPage')
            else:
                btn_next = bro.find_element('xpath', '//a[contains(text(),"下一页")]')
            
            url = btn_next.get_attribute('href')
            if url:
                bro.get(url)
            else:
                print("下一页链接为空，停止翻页")
                break
            sleep(random.uniform(2, 4))
            
            # 滚动加载
            for j in range(1, 3):
                bro.execute_script('window.scrollTo(0,document.body.scrollHeight)')
                sleep(random.uniform(2, 3))
            
            # 解析新页面
            tree = etree.HTML(bro.page_source)
            if page_type == "product":
                new_items = tree.xpath('//div[@id="product-list"]/ul/li')
            else:
                new_items = tree.xpath('//div[contains(@class, "item-list")]/ul/li')
            
            goods_li_list.extend(new_items)
        except Exception as e:
            print(f"翻页失败: {str(e)}")
            break
    
    # 解析商品信息 - 优化版本：先收集所有商品信息，再批量分类
    raw_goods_list = []
    
    for li in goods_li_list:
        try:
            # 商品图片
            if page_type == "product":
                goods_img = li.xpath('.//div[@class="img-block"]/a/img/@src')[0]
            else:
                goods_img = li.xpath('.//div[contains(@class, "img-block")]/a/img/@src')[0]
            
            goods_img = 'https:' + goods_img if not goods_img.startswith('http') else goods_img
            
            # 商品标题
            if page_type == "product":
                goods_title = ''.join(li.xpath('.//div[@class="title-selling-point"]/a//text()')).replace('\n', '').strip()
            else:
                goods_title = ''.join(li.xpath('.//div[contains(@class, "title-selling-point")]/a//text()')).replace('\n', '').strip()
            
            # 商品价格
            if page_type == "product":
                price_elem = li.xpath('.//div[@class="price-box"]//text()')
            else:
                price_elem = li.xpath('.//div[contains(@class, "price-box")]//text()')
            
            goods_price = ''.join([p.strip() for p in price_elem if p.strip()])
            goods_price = draw_num(goods_price)
            if not goods_price:
                continue
            
            # 销量
            if page_type == "product":
                goods_sales = li.xpath('.//div[@class="info-evaluate"]/a/i/text()')
            else:
                goods_sales = li.xpath('.//div[contains(@class, "info-evaluate")]/a/i/text()')
            
            goods_sales = goods_sales[0] if goods_sales else '0'
            
            # 店铺名
            if page_type == "product":
                shop_elem = li.xpath('.//div[@class="store-stock"]/a/text()')
            else:
                shop_elem = li.xpath('.//div[contains(@class, "store-stock")]/a/text()')
            
            goods_shop = shop_elem[0] if shop_elem else '未知'
            
            # 商品链接
            if page_type == "product":
                link_str = li.xpath('.//div[@class="title-selling-point"]/a/@sa-data')[0]
                link_list = link_str.split(',')
                link_shop_id = draw_num(link_list[2])
                link_prd_id = draw_num(link_list[1])
                goods_link = f'https://product.suning.com/{link_shop_id}/{link_prd_id}.html'
            else:
                goods_link = li.xpath('.//div[contains(@class, "title-selling-point")]/a/@href')[0]
                goods_link = 'https:' + goods_link if not goods_link.startswith('http') else goods_link
            
            # 收集原始商品信息
            raw_goods_list.append({
                'goods_img': goods_img,
                'goods_title': goods_title[:127],  # 限制标题长度
                'goods_price': float(goods_price),
                'goods_sales': goods_sales.replace('+', '') if goods_sales else '0',
                'shop_title': goods_shop,
                'shop_platform': '苏宁',
                'goods_link': goods_link,
                'grab_time': time.strftime('%Y-%m-%d %H:%M', time.localtime()),
                'page_type': page_type,  # 添加页面类型标识
            })
        except Exception as e:
            print(f"解析商品时出错: {str(e)}")
            continue
    
    # 批量分类处理
    print(f"开始批量分类 {len(raw_goods_list)} 个商品...")
    classification_items = [
        {'title': item['goods_title'], 'brand': item['shop_title']} 
        for item in raw_goods_list
    ]
    
    # 使用批量分类
    categories = classify_batch(classification_items)
    
    # 组装最终结果
    for i, item in enumerate(raw_goods_list):
        item['category'] = clean_category(categories[i] if i < len(categories) else '未分类')
        goods_info.append(item)
    
    sleep(2)
    bro.quit()
    return goods_info

def save_to_csv(data, filename='suning_products.csv'):
    """
    将爬取的数据保存为严格符合RFC 4180标准的CSV文件
    主要改进：
    1. 严格处理字段中的特殊字符（逗号、换行符、引号）
    2. 确保所有字段正确引用
    3. 统一换行符为CRLF
    4. 正确处理空值和None
    5. 强制字段顺序一致性
    """
    if not data:
        print("没有数据可保存")
        return False
    
    # 定义标准字段顺序
    standard_fields = [
        'goods_img', 'goods_title', 'goods_price', 
        'goods_sales', 'shop_title', 'shop_platform',
        'goods_link', 'grab_time', 'page_type', 'category'
    ]
    
    try:
        with open(filename, 'w', newline='\r\n', encoding='utf-8-sig') as csvfile:
            writer = csv.DictWriter(
                csvfile, 
                fieldnames=standard_fields,
                delimiter=',',
                quoting=csv.QUOTE_ALL,  # 所有字段都用引号包裹，确保安全
                quotechar='"',
                doublequote=True,  # 使用双引号转义字段内的引号
                escapechar=None,   # 禁用反斜杠转义
                strict=True        # 严格模式确保字段一致性
            )
            
            writer.writeheader()
            
            success_count = 0
            for row in data:
                try:
                    # 数据清洗处理
                    cleaned_row = {
                        'goods_img': clean_url(row.get('goods_img', '')),
                        'goods_title': clean_text(row.get('goods_title', ''), max_length=200),
                        'goods_price': clean_price(row.get('goods_price', 0)),
                        'goods_sales': clean_sales(row.get('goods_sales', '0')),
                        'shop_title': clean_text(row.get('shop_title', '未知店铺')),
                        'shop_platform': row.get('shop_platform', '未知平台'),
                        'goods_link': clean_url(row.get('goods_link', '')),
                        'grab_time': row.get('grab_time', datetime.now().strftime('%Y-%m-%d %H:%M:%S')),
                        'page_type': row.get('page_type', 'product'),
                        'category': row.get('category', '未分类')
                    }
                    
                    # 确保所有字段都是字符串且正确处理None值
                    cleaned_row = {k: '' if v is None else str(v) for k, v in cleaned_row.items()}
                    
                    writer.writerow(cleaned_row)
                    success_count += 1
                except Exception as e:
                    print(f"⚠️ 处理数据行时出错（跳过该行）: {str(e)}")
                    continue
        
        print(f"✅ 成功保存 {success_count}/{len(data)} 条标准CSV数据到 {filename}")
        return True
    
    except Exception as e:
        print(f"❌ 保存失败: {str(e)}")
        return False

def clean_text(text, max_length=200):
    """严格清洗文本字段，确保符合CSV规范"""
    if text is None:
        return ''
    
    text = str(text).strip()
    
    # 1. 去除多余空白字符
    text = ' '.join(text.split())
    
    # 2. 长度限制
    if len(text) > max_length:
        text = text[:max_length-3] + '...'
    
    # 3. CSV特殊字符已在writer中处理，这里不再重复处理
    
    return text

def clean_price(price):
    """严格价格清洗，返回标准格式字符串"""
    if price is None:
        return '0.00'
    
    try:
        # 统一转换为浮点数再格式化
        price_float = float(str(price).replace(',', '').strip())
        return '{:.2f}'.format(price_float)
    except (ValueError, TypeError):
        return '0.00'

def clean_url(url):
    """URL标准化处理，确保有效URL"""
    if url is None:
        return ''
    
    url = str(url).strip()
    if not url:
        return ''
    
    if not url.startswith(('http://', 'https://')):
        return f'https:{url}' if url.startswith('//') else f'https://{url}'
    return url

def clean_sales(sales):
    """销量数据清洗，返回标准格式字符串"""
    if sales is None:
        return '0'
    
    sales = str(sales).strip()
    sales = re.sub(r'[^0-9]', '', sales)  # 只保留数字
    return sales if sales else '0'

def analyze_category_distribution(goods_list):
    """分析商品分类分布"""
    category_count = {}
    for item in goods_list:
        category = item.get('category', '未分类')
        category_count[category] = category_count.get(category, 0) + 1
    
    print("\n📊 商品分类分布:")
    for category, count in sorted(category_count.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / len(goods_list)) * 100
        print(f"  {category}: {count} 件 ({percentage:.1f}%)")
    
    return category_count

def write_to_mysql(goods):
    conn = pymysql.connect(
        host='localhost',
        user='root',
        password='whu123456',
        database='pricecompare',
        charset='utf8mb4'
    )
    cursor = conn.cursor()

    desc = goods.get('goods_title', '暂无描述')
    # 确保图片链接完整，写入 img 字段
    img = goods.get('goods_img', '')
    if img and not img.startswith('http'):
        img = 'https:' + img if img.startswith('//') else img
    # category
    category = goods.get('category', '未分类')
    # 品牌名用店铺名
    brand_name = goods.get('shop_title', '未知品牌')
    cursor.execute("SELECT id FROM brands WHERE name=%s", (brand_name,))
    brand_result = cursor.fetchone()
    if brand_result:
        brand_id = brand_result[0]
    else:
        cursor.execute("INSERT INTO brands (name) VALUES (%s)", (brand_name,))
        brand_id = cursor.lastrowid

    # 自动判定 is_hot 和 is_drop
    try:
        sales = int(goods.get('goods_sales', '0'))
    except Exception:
        sales = 0
    is_hot = 1 if sales > 2000 else 0

    price_yuan = float(goods['goods_price']) / 100 if float(goods['goods_price']) > 1000 else float(goods['goods_price'])
    is_drop = 1 if price_yuan < 100 else 0

    # 查找或插入 products
    cursor.execute("SELECT id FROM products WHERE title=%s", (goods['goods_title'],))
    result = cursor.fetchone()
    if result:
        product_id = result[0]
    else:
        cursor.execute(
            """INSERT INTO products \
            (title, `desc`, img, category, brand_id, is_hot, is_drop, created_at, updated_at, status)\
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW(), 1)\
            """, (goods['goods_title'], desc, img, category, brand_id, is_hot, is_drop)
        )
        product_id = cursor.lastrowid

    # 插入 product_prices（价格转为元，保留两位小数），避免重复
    price_date = goods['grab_time'].split(' ')[0]
    cursor.execute(
        "SELECT id FROM product_prices WHERE product_id=%s AND platform=%s AND date=%s",
        (product_id, goods['shop_platform'], price_date)
    )
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO product_prices (product_id, platform, price, date, url, created_at) VALUES (%s, %s, %s, %s, %s, NOW())",
            (product_id, goods['shop_platform'], round(price_yuan, 2), price_date, goods['goods_link'])
        )

    conn.commit()
    cursor.close()
    conn.close()

if __name__ == "__main__":
    # 分类策略配置说明
    print("🚀 智能分类优化配置:")
    print(f"  - 缓存启用: {CLASSIFICATION_STRATEGY['use_cache']}")
    print(f"  - 批量AI分类: {CLASSIFICATION_STRATEGY['use_batch_ai']}")
    print(f"  - 传统方法优先: {CLASSIFICATION_STRATEGY['use_traditional_first']}")
    print(f"  - 最大并发数: {CLASSIFICATION_STRATEGY['max_concurrent_requests']}")
    print(f"  - 缓存过期天数: {CLASSIFICATION_STRATEGY['cache_expire_days']}")
    
    # 支持批量关键词采集
    keywords = ["李宁", "耐克", "阿迪达斯", "安踏", "特步", "鸿星尔克", "匹克", "乔丹", "彪马", "斐乐"]
    total_count = 0
    
    for word in keywords:
        print(f"\n开始采集关键词：{word}")
        start_time = time.time()
        
        sn_goods_info = crawler(goods_word=word)
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        save_to_csv(sn_goods_info, filename=f'suning_products_{word}.csv')
        print(f"共获取 {len(sn_goods_info)} 条商品数据 for {word}")
        print(f"处理时间: {processing_time:.2f} 秒")
        print(f"平均每个商品: {processing_time/len(sn_goods_info):.3f} 秒")
        
        # 分析分类分布
        analyze_category_distribution(sn_goods_info)
        
        for idx, item in enumerate(sn_goods_info[:3], 1):  # 打印前3条作为示例
            print(f"\n商品 {idx}:")
            print(f"类型: {'商品页' if item['page_type'] == 'product' else '品牌页'}")
            print(f"分类: {item['category']}")
            print(f"标题: {item['goods_title']}")
            print(f"价格: {item['goods_price']}")
            print(f"销量: {item['goods_sales']}")
            print(f"店铺: {item['shop_title']}")
            print(f"链接: {item['goods_link']}")
        
        # 新增：写入数据库
        for item in sn_goods_info:
            write_to_mysql(item)
        total_count += len(sn_goods_info)
    
    print(f"\n✅ 采集完成！已写入 {total_count} 条商品数据到数据库")
    print("💡 优化建议:")
    print("  1. 首次运行会较慢，后续运行会利用缓存加速")
    print("  2. 可以调整 CLASSIFICATION_STRATEGY 配置来平衡速度和准确性")
    print("  3. 如需更快的速度，可以设置 'use_traditional_first': True")
    print("  4. 如需更高准确性，可以设置 'use_traditional_first': False")
