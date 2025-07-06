from lxml import etree
from time import sleep
from app01.utils.utils_func import draw_num, avoid_check
import time
import random
import csv
from datetime import datetime
import re
import pymysql
import jieba
import jieba.analyse
from collections import Counter

# 增强版商品分类关键词映射 - 多层级权重系统
CATEGORY_KEYWORDS_ENHANCED = {
    '手机数码': {
        'primary': ['手机', 'iPhone', '华为', '小米', 'OPPO', 'vivo', '三星', '魅族', '一加', 'realme', 'iQOO', '荣耀', '红米', '苹果', '智能手机'],
        'secondary': ['平板', 'iPad', '电脑', '笔记本', 'MacBook', 'ThinkPad', '戴尔', '联想', '华硕', '惠普', '数码', '相机', '单反', '微单', '摄像机'],
        'tertiary': ['耳机', '音响', '蓝牙耳机', '无线耳机', '充电器', '数据线', '充电宝', '移动电源', '智能手表', '手环', '数码产品'],
        'exclude': ['手机壳', '手机膜', '手机支架', '手机套']  # 排除词
    },
    '服装鞋帽': {
        'primary': ['衣服', '上衣', '裤子', '裙子', '外套', '羽绒服', '棉服', '卫衣', 'T恤', '衬衫', '牛仔裤', '运动裤', '休闲裤', '西装', '礼服'],
        'secondary': ['内衣', '内裤', '袜子', '鞋子', '运动鞋', '跑鞋', '篮球鞋', '足球鞋', '帆布鞋', '皮鞋', '凉鞋', '拖鞋', '靴子'],
        'tertiary': ['帽子', '棒球帽', '鸭舌帽', '毛线帽', '围巾', '手套', '腰带', '包包', '背包', '手提包', '钱包', '双肩包', '服装', '男装', '女装', '童装', '时尚'],
        'exclude': ['衣架', '晾衣架', '衣柜', '鞋柜']
    },
    '运动户外': {
        'primary': ['运动', '健身', '跑步', '篮球', '足球', '羽毛球', '乒乓球', '网球', '游泳', '瑜伽'],
        'secondary': ['户外', '登山', '徒步', '露营', '钓鱼', '骑行', '滑雪', '滑板', '轮滑'],
        'tertiary': ['健身器材', '哑铃', '跑步机', '动感单车', '瑜伽垫', '运动服', '运动裤', '运动袜', '护具', '护膝', '护腕', '护肘', '头盔', '手套', '运动装备', '户外装备', '体育用品'],
        'exclude': ['运动饮料', '运动营养品']
    },
    '家居生活': {
        'primary': ['家具', '沙发', '床', '桌子', '椅子', '柜子', '衣柜', '书柜', '鞋柜', '茶几', '电视柜', '餐桌', '书桌', '办公桌'],
        'secondary': ['床垫', '枕头', '被子', '床单', '被套', '枕套', '毛巾', '浴巾', '浴袍'],
        'tertiary': ['家居', '家装', '装饰', '摆件', '花瓶', '相框', '地毯', '窗帘', '灯具', '台灯', '吊灯', '壁灯', '吸顶灯', '家居用品'],
        'exclude': ['家具清洁剂', '家具维修']
    },
    '食品饮料': {
        'primary': ['零食', '饼干', '薯片', '糖果', '巧克力', '坚果', '瓜子', '花生', '核桃', '杏仁', '腰果', '开心果'],
        'secondary': ['饮料', '可乐', '雪碧', '果汁', '奶茶', '咖啡', '茶', '矿泉水', '纯净水', '牛奶', '酸奶'],
        'tertiary': ['面包', '蛋糕', '月饼', '粽子', '方便面', '火腿肠', '罐头', '调味品', '酱油', '醋', '盐', '糖', '油', '米', '面', '面条', '食品', '零食', '小吃', '饮品'],
        'exclude': ['食品包装', '食品加工']
    },
    '母婴用品': {
        'primary': ['尿不湿', '纸尿裤', '湿巾', '奶瓶', '奶嘴', '吸奶器', '婴儿车', '婴儿床', '摇篮'],
        'secondary': ['玩具', '积木', '拼图', '毛绒玩具', '益智玩具', '早教', '绘本', '故事书'],
        'tertiary': ['婴儿服', '连体衣', '爬服', '围嘴', '口水巾', '润肤露', '护臀膏', '母婴', '婴儿', '宝宝', '儿童', '幼儿', '母婴用品'],
        'exclude': ['成人用品', '成人服装']
    },
    '美妆护肤': {
        'primary': ['护肤品', '洗面奶', '爽肤水', '精华液', '面霜', '乳液', '眼霜', '面膜', '防晒霜', '隔离霜'],
        'secondary': ['粉底液', 'BB霜', 'CC霜', '遮瑕膏', '散粉', '定妆粉', '腮红', '眼影', '眼线笔', '睫毛膏', '眉笔', '口红', '唇膏', '唇彩', '指甲油'],
        'tertiary': ['香水', '护发素', '发膜', '精油', '美容仪', '化妆刷', '美妆蛋', '美妆', '护肤', '化妆品', '彩妆'],
        'exclude': ['美容院', '美容服务']
    },
    '图书音像': {
        'primary': ['图书', '小说', '文学', '历史', '哲学', '心理学', '经济学', '管理学', '计算机', '编程', '技术', '教材', '教辅', '考试'],
        'secondary': ['英语', '数学', '语文', '物理', '化学', '生物', '地理', '政治', '音乐', 'CD', 'DVD', '蓝光'],
        'tertiary': ['电影', '电视剧', '纪录片', '动画', '游戏', '手柄', '键盘', '鼠标', '显示器', '音箱', '书籍', '杂志', '音像制品'],
        'exclude': ['游戏机', '游戏设备']
    },
    '汽车用品': {
        'primary': ['汽车', '轮胎', '机油', '机滤', '空滤', '汽滤', '刹车片', '刹车盘', '火花塞', '电瓶', '蓄电池'],
        'secondary': ['雨刷', '雨刮器', '车灯', '大灯', '尾灯', '转向灯', '雾灯', '车膜', '贴膜', '脚垫', '座套', '方向盘套', '挂件', '摆件'],
        'tertiary': ['导航', '行车记录仪', '倒车雷达', '倒车影像', '车载充电器', '车载冰箱', '车载吸尘器', '汽车配件', '汽配'],
        'exclude': ['汽车', '摩托车', '电动车']
    },
    '医药保健': {
        'primary': ['药品', '感冒药', '退烧药', '消炎药', '止痛药', '维生素', '钙片', '鱼油', '蛋白粉'],
        'secondary': ['保健品', '营养品', '减肥药', '减肥茶', '减肥产品', '医疗器械', '血压计', '血糖仪', '体温计', '听诊器'],
        'tertiary': ['按摩器', '按摩椅', '按摩垫', '理疗仪', '艾灸', '拔罐', '刮痧', '针灸', '中药', '中药材', '中成药', '西药', '处方药', '非处方药', '医药', '保健', '医疗'],
        'exclude': ['医院', '诊所', '医疗服务']
    }
}

# 品牌关键词映射 - 提高品牌相关商品的分类准确度
BRAND_CATEGORY_MAPPING = {
    '手机数码': ['苹果', '华为', '小米', 'OPPO', 'vivo', '三星', '魅族', '一加', 'realme', 'iQOO', '荣耀', '红米', '联想', '戴尔', '华硕', '惠普', 'ThinkPad', 'MacBook', 'iPad'],
    '服装鞋帽': ['李宁', '耐克', '阿迪达斯', '安踏', '特步', '鸿星尔克', '匹克', '乔丹', '彪马', '斐乐', '匡威', '万斯', '新百伦', '斯凯奇'],
    '运动户外': ['李宁', '耐克', '阿迪达斯', '安踏', '特步', '鸿星尔克', '匹克', '乔丹', '彪马', '斐乐', '匡威', '万斯', '新百伦', '斯凯奇'],
    '美妆护肤': ['兰蔻', '雅诗兰黛', '欧莱雅', '资生堂', 'SK-II', '海蓝之谜', '倩碧', '科颜氏', '悦诗风吟', '雪花秀'],
    '食品饮料': ['可口可乐', '百事可乐', '娃哈哈', '农夫山泉', '康师傅', '统一', '蒙牛', '伊利', '光明', '三元'],
    '母婴用品': ['花王', '帮宝适', '好奇', '妈咪宝贝', '贝亲', '飞利浦', '新安怡', '美德乐', '好孩子', '贝贝怡'],
    '家居生活': ['宜家', '全友', '顾家', '索菲亚', '欧派', '志邦', '金牌', '皮阿诺', '好莱客', '尚品宅配'],
    '汽车用品': ['米其林', '普利司通', '固特异', '邓禄普', '马牌', '倍耐力', '佳通', '玲珑', '朝阳', '正新'],
    '医药保健': ['同仁堂', '云南白药', '片仔癀', '东阿阿胶', '九芝堂', '太极', '哈药', '华北制药', '东北制药', '新华制药'],
    '图书音像': ['商务印书馆', '中华书局', '人民文学', '机械工业', '电子工业', '清华大学出版社', '北京大学出版社', '高等教育出版社']
}

def enhanced_category_recognition(title, brand=None, description=None):
    """
    增强版商品分类识别 - 多维度分析
    """
    if not title:
        return '未分类'
    
    title_lower = title.lower()
    title_words = list(jieba.cut(title))
    
    # 1. 品牌优先分类
    if brand:
        brand_lower = brand.lower()
        for category, brands in BRAND_CATEGORY_MAPPING.items():
            for brand_keyword in brands:
                if brand_keyword.lower() in brand_lower:
                    return category
    
    # 2. 多层级关键词评分
    category_scores = {}
    
    for category, keyword_layers in CATEGORY_KEYWORDS_ENHANCED.items():
        score = 0
        
        # 检查排除词
        exclude_found = False
        for exclude_word in keyword_layers['exclude']:
            if exclude_word.lower() in title_lower:
                exclude_found = True
                break
        
        if exclude_found:
            continue
        
        # 主要关键词 (权重: 10)
        for keyword in keyword_layers['primary']:
            if keyword.lower() in title_lower:
                score += 10
                # 完整匹配加分
                if keyword.lower() in title_words:
                    score += 5
        
        # 次要关键词 (权重: 5)
        for keyword in keyword_layers['secondary']:
            if keyword.lower() in title_lower:
                score += 5
                if keyword.lower() in title_words:
                    score += 2
        
        # 三级关键词 (权重: 2)
        for keyword in keyword_layers['tertiary']:
            if keyword.lower() in title_lower:
                score += 2
                if keyword.lower() in title_words:
                    score += 1
        
        if score > 0:
            category_scores[category] = score
    
    # 3. 关键词密度分析
    if category_scores:
        # 计算关键词密度
        for category, score in category_scores.items():
            keyword_layers = CATEGORY_KEYWORDS_ENHANCED[category]
            all_keywords = keyword_layers['primary'] + keyword_layers['secondary'] + keyword_layers['tertiary']
            
            # 计算匹配的关键词数量
            matched_keywords = sum(1 for keyword in all_keywords if keyword.lower() in title_lower)
            density = matched_keywords / len(title_words) if title_words else 0
            
            # 密度加分
            if density > 0.1:  # 关键词密度超过10%
                category_scores[category] += int(density * 50)
    
    # 4. 返回得分最高的分类
    if category_scores:
        best_category = max(category_scores.items(), key=lambda x: x[1])[0]
        return best_category
    
    return '未分类'

def get_category_from_page_enhanced(tree, page_type, title=None):
    """
    增强版页面分类提取
    """
    try:
        if page_type == "product":
            # 1. 尝试从面包屑导航获取分类
            breadcrumb_selectors = [
                '//div[@class="breadcrumb"]//text()',
                '//div[contains(@class, "breadcrumb")]//text()',
                '//nav[contains(@class, "breadcrumb")]//text()',
                '//ol[contains(@class, "breadcrumb")]//text()'
            ]
            
            for selector in breadcrumb_selectors:
                breadcrumb = tree.xpath(selector)
                if breadcrumb:
                    breadcrumb_text = ''.join(breadcrumb).strip()
                    # 从面包屑中提取分类
                    for category in CATEGORY_KEYWORDS_ENHANCED.keys():
                        if category in breadcrumb_text:
                            return category
            
            # 2. 尝试从页面标题获取分类
            if title:
                return enhanced_category_recognition(title)
            
            # 3. 尝试从页面title标签获取
            page_title = tree.xpath('//title/text()')
            if page_title:
                title_text = page_title[0].strip()
                return enhanced_category_recognition(title_text)
        
        return '未分类'
    except Exception as e:
        print(f"提取页面分类时出错: {str(e)}")
        return '未分类'

def analyze_category_accuracy(goods_list):
    """
    分析分类准确度
    """
    print("\n🔍 分类准确度分析:")
    
    # 统计每个分类的商品数量
    category_count = {}
    for item in goods_list:
        category = item.get('category', '未分类')
        category_count[category] = category_count.get(category, 0) + 1
    
    # 计算准确度指标
    total_items = len(goods_list)
    classified_items = sum(count for category, count in category_count.items() if category != '未分类')
    accuracy_rate = (classified_items / total_items) * 100 if total_items > 0 else 0
    
    print(f"  总商品数: {total_items}")
    print(f"  已分类商品: {classified_items}")
    print(f"  分类准确率: {accuracy_rate:.1f}%")
    
    print("\n📊 分类分布:")
    for category, count in sorted(category_count.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / total_items) * 100
        print(f"  {category}: {count} 件 ({percentage:.1f}%)")
    
    # 分析可能的错误分类
    print("\n⚠️ 可能的错误分类检查:")
    suspicious_keywords = ['手机壳', '手机膜', '手机支架', '手机套', '衣架', '晾衣架', '衣柜', '鞋柜']
    
    for item in goods_list:
        title = item.get('goods_title', '').lower()
        category = item.get('category', '')
        
        for keyword in suspicious_keywords:
            if keyword in title and category in ['手机数码', '服装鞋帽']:
                print(f"  可疑: {item.get('goods_title', '')} -> {category}")
                break
    
    return category_count, accuracy_rate

def test_enhanced_classification():
    """
    测试增强版分类识别
    """
    test_cases = [
        ("iPhone 14 Pro Max 256GB 深空黑色 智能手机", "手机数码"),
        ("李宁运动鞋男2024新款跑步鞋", "运动户外"),
        ("华为手机壳iPhone14保护套", "服装鞋帽"),  # 应该被排除
        ("耐克篮球鞋Nike Air Jordan", "运动户外"),
        ("小米平板电脑iPad Pro", "手机数码"),
        ("安踏运动服套装", "运动户外"),
        ("手机支架桌面懒人支架", "未分类"),  # 应该被排除
        ("华为Mate60 Pro手机", "手机数码"),
        ("李宁运动裤男", "运动户外"),
        ("苹果iPhone15手机壳", "服装鞋帽"),  # 应该被排除
    ]
    
    print("🧪 增强版分类识别测试:")
    correct_count = 0
    
    for title, expected in test_cases:
        result = enhanced_category_recognition(title)
        is_correct = result == expected
        if is_correct:
            correct_count += 1
        
        status = "✅" if is_correct else "❌"
        print(f"  {status} {title} -> {result} (期望: {expected})")
    
    accuracy = (correct_count / len(test_cases)) * 100
    print(f"\n测试准确率: {accuracy:.1f}% ({correct_count}/{len(test_cases)})")

if __name__ == "__main__":
    # 运行测试
    test_enhanced_classification()
    
    print("\n" + "="*50)
    print("增强版分类识别系统特性:")
    print("1. 多层级关键词权重系统")
    print("2. 品牌优先分类机制")
    print("3. 关键词密度分析")
    print("4. 排除词过滤")
    print("5. 完整匹配加分")
    print("6. 准确度分析工具")
    print("="*50) 