from difflib import SequenceMatcher
import yaml
from pathlib import Path
from PIL import Image
from io import BytesIO
import requests
import hashlib
import re
import logging
import csv
from collections import defaultdict

class ProductMatcher:
    def __init__(self, config_path=None):
        # 第一步：初始化logger（必须在其他操作之前）
        self.logger = logging.getLogger(self.__class__.__name__)
        self.logger.setLevel(logging.INFO)
        if not self.logger.handlers:
            ch = logging.StreamHandler()
            ch.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
            self.logger.addHandler(ch)
        
        # 第二步：设置配置路径
        if not config_path:
            config_path = Path(__file__).parent.parent / "config" / "rules.yaml"
        
        # 第三步：加载配置文件
        self.rules = self._load_config(config_path)
        
        # 第四步：设置默认值
        self._set_defaults()
        
        # 第五步：初始化图片哈希缓存
        self.image_hash_cache = {}

    def _load_config(self, config_path):
        """加载并验证配置文件"""
        encodings = ['utf-8', 'utf-8-sig', 'gb18030', 'latin-1']
        for encoding in encodings:
            try:
                with open(config_path, 'r', encoding=encoding) as f:
                    rules = yaml.safe_load(f) or {}
                    self.logger.info(f"成功使用 {encoding} 编码加载配置")
                    return rules
            except UnicodeDecodeError:
                continue
            except yaml.YAMLError as e:
                self.logger.error(f"YAML解析错误: {e}")
                raise
            except FileNotFoundError:
                self.logger.error(f"配置文件未找到: {config_path}")
                raise
        
        raise ValueError(f"无法加载配置文件 {config_path}，尝试了多种编码均失败")

    def _set_defaults(self):
        """设置默认配置值"""
        self.rules.setdefault('matching', {})
        self.rules['matching'].setdefault('similarity_threshold', 0.5)
        
        # 设置各匹配维度的权重
        weights = self.rules['matching'].setdefault('weights', {})
        weights.setdefault('title', 0.4)
        weights.setdefault('description', 0.2)
        weights.setdefault('price', 0.2)
        weights.setdefault('images', 0.2)
        
        # 设置价格匹配参数
        price_rules = self.rules['matching'].setdefault('price_rules', {})
        price_rules.setdefault('max_percentage_diff', 0.9)  # 价格最大差异百分比
        price_rules.setdefault('allow_free_shipping_diff', True)
        
        # 设置图片匹配参数
        image_rules = self.rules['matching'].setdefault('image_rules', {})
        image_rules.setdefault('hash_size', 32)  # 哈希大小 (16x16 = 256位)
        image_rules.setdefault('min_similar_images', 1)  # 最小相似图片数
        image_rules.setdefault('similarity_threshold', 0.8)  # 图片相似度阈值

    def is_same_product(self, product1, product2):
        """判断两个商品是否相似"""
        # 提取匹配所需的商品属性
        p1 = self._extract_product_features(product1)
        p2 = self._extract_product_features(product2)
        # 计算各维度相似度
        title_sim = self._compare_text(p1['title'], p2['title'])
        desc_sim = self._compare_text(p1['description'], p2['description'])
        price_sim = self._compare_prices(p1['price'], p2['price'])
        image_sim = self._compare_images(p1['images'], p2['images'])
        
        # 计算综合相似度
        weights = self.rules['matching']['weights']
        overall_similarity = (
            title_sim * weights['title'] +
            desc_sim * weights['description'] +
            price_sim * weights['price'] +
            image_sim * weights['images']
        )* (0.5 if p1['platform'] == p2['platform'] else 1.2) 
        
        # 记录匹配详情
        self.logger.debug(f"商品匹配详情: "
                         f"标题相似度={title_sim:.2f}, "
                         f"描述相似度={desc_sim:.2f}, "
                         f"价格相似度={price_sim:.2f}, "
                         f"图片相似度={image_sim:.2f}, "
                         f"综合相似度={overall_similarity:.2f}")
        
        return {
            'is_same': overall_similarity >= self.rules['matching']['similarity_threshold'],
            'similarity': overall_similarity,
            'breakdown': {
                'title': title_sim,
                'description': desc_sim,
                'price': price_sim,
                'images': image_sim
            }
        }

    def _extract_product_features(self, product):
        """提取和标准化商品特征"""
        title = re.sub(r'(202[0-9]|新款|正品|春季|夏季|秋季|冬季|潮流|\d+|[a-zA-Z]+)', '', 
                  product.get('title', '').strip().lower())
        return {
            'platform': product.get('platform'),
            'title': product.get('title', '').strip().lower(),
            'description': product.get('description', '').strip().lower(),
            'price': self._parse_price(product.get('price', '')),
            'images': product.get('images', [])
        }

    def _parse_price(self, price_text):
        """解析价格文本为浮点数"""
        if not price_text:
            return None
        
        # 处理常见价格格式（如 "¥1,234.56", "$1234.56"）
        try:
            # 移除货币符号和千位分隔符
            price_text = re.sub(r'[^\d\.]', '', price_text)
            return float(price_text)
        except (ValueError, TypeError):
            #self.logger.warning(f"无法解析价格: {price_text}")
            return None

    def _compare_text(self, text1, text2):
        """比较两段文本的相似度"""
        if not text1 or not text2:
            return 0
        
        # 基础相似度
        similarity = SequenceMatcher(None, text1, text2).ratio()
        
        # 增强匹配：检查关键属性是否完全匹配
        if similarity > 0.5:  # 只对中等相似度以上的文本进行增强检查
            # 提取关键属性（如品牌、型号等）
            # 这里可以根据具体业务需求定制
            keywords = ['brand', 'model', 'color', 'size']
            keyword_matches = 0
            keyword_count = 0
            
            for keyword in keywords:
                pattern = re.compile(rf'\b{keyword}[:=]\s*([^\s,]+)\b', re.IGNORECASE)
                match1 = pattern.search(text1)
                match2 = pattern.search(text2)
                
                if match1 and match2:
                    keyword_count += 1
                    if match1.group(1).lower() == match2.group(1).lower():
                        keyword_matches += 1
            
            # 如果有关键属性匹配，提高相似度
            if keyword_count > 0:
                keyword_bonus = keyword_matches / keyword_count * 0.2
                similarity = min(1.0, similarity + keyword_bonus)
        
        return similarity

    def _compare_prices(self, price1, price2):
        """比较两个价格的相似度"""
        if price1 is None or price2 is None:
            return 0.5  # 无法比较时返回中等相似度
        
        if price1 == 0 and price2 == 0:
            return 1.0
        
        max_diff = self.rules['matching']['price_rules']['max_percentage_diff']
        
        # 计算价格差异百分比
        price_diff = abs(price1 - price2) / max(price1, price2)
        
        # 如果差异在允许范围内，返回相似度
        if price_diff <= max_diff:
            return 1.0 - price_diff
        
        return 0.0

    def _compare_images(self, images1, images2):
        """比较两组图片的相似度"""
        if not images1 or not images2:
            return 0
        
        hash_size = self.rules['matching']['image_rules']['hash_size']
        min_similar = self.rules['matching']['image_rules']['min_similar_images']
        image_threshold = self.rules['matching']['image_rules']['similarity_threshold']
        
        # 计算所有图片的哈希值
        hashes1 = [self._get_image_hash(url, hash_size) for url in images1]
        hashes2 = [self._get_image_hash(url, hash_size) for url in images2]
        
        # 找出最相似的图片对
        max_similarities = []
        for h1 in hashes1:
            if not h1:
                continue
            similarities = []
            for h2 in hashes2:
                if not h2:
                    continue
                similarity = self._compare_image_hashes(h1, h2)
                similarities.append(similarity)
            
            if similarities:
                max_similarities.append(max(similarities))
        
        # 如果没有找到相似的图片对
        if not max_similarities:
            return 0
        
        # 计算平均相似度（只考虑超过阈值的图片对）
        valid_similarities = [s for s in max_similarities if s >= image_threshold]
        
        if not valid_similarities:
            return 0
        
        # 如果相似图片数量不足，返回0
        if len(valid_similarities) < min_similar:
            return 0
        
        return sum(valid_similarities) / len(valid_similarities)

    def _get_image_hash(self, url, hash_size=16):
        """计算图片的感知哈希值"""
        # 检查缓存
        cache_key = f"{url}_{hash_size}"
        if cache_key in self.image_hash_cache:
            return self.image_hash_cache[cache_key]
        
        try:
            # 尝试获取图片内容
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            
            # 计算哈希
            img = Image.open(BytesIO(response.content))
            img = img.resize((hash_size, hash_size), Image.LANCZOS).convert('L')
            pixels = list(img.getdata())
            avg = sum(pixels) / len(pixels)
            bits = "".join(['1' if (px >= avg) else '0' for px in pixels])
            
            # 缓存结果
            self.image_hash_cache[cache_key] = bits
            return bits
        except Exception as e:
            self.logger.warning(f"无法获取或处理图片 {url}: {e}")
            return None

    def _compare_image_hashes(self, hash1, hash2):
        """比较两个图片哈希的相似度"""
        if not hash1 or not hash2:
            return 0
        
        # 计算汉明距离
        distance = sum(c1 != c2 for c1, c2 in zip(hash1, hash2))
        similarity = 1.0 - (distance / len(hash1))
        
        return similarity

def standardize_product_data(product):
    """标准化商品数据格式"""
    return {
        'goods_title': str(product.get('goods_title', '')).strip(),
        'goods_price': float(product.get('goods_price', 0)),
        'goods_sales': str(product.get('goods_sales', '0')),
        'goods_img': str(product.get('goods_img', '')),
        'shop_title': str(product.get('shop_title', '')).strip(),
        'shop_platform': str(product.get('shop_platform', '')).strip(),
        'goods_link': str(product.get('goods_link', '')),
        'grab_time': str(product.get('grab_time', '')),
        'page_type': str(product.get('page_type', 'product')),
        'search_keyword': str(product.get('search_keyword', '')).strip(),
        'brand': str(product.get('brand', '未知')).strip()
    }

def group_products_by_similarity(suning_list, pdd_list, matcher=None):
    """
    先按品牌粗分组，再在品牌组内用ProductMatcher细分，允许跨平台商品分到同组。
    返回分组字典：{分组key: [商品列表]}
    """
    if matcher is None:
        matcher = ProductMatcher()
    
    # 标准化商品数据格式
    def standardize_product(product, platform):
        standardized = standardize_product_data(product)
        return {
            'title': standardized['goods_title'],
            'description': standardized['goods_title'],  # 用标题作为描述
            'price': standardized['goods_price'],
            'images': [standardized['goods_img']] if standardized['goods_img'] else [],
            'platform': platform,
            'brand': standardized['brand'],
            'original_data': standardized
        }
    
    # 标准化所有商品
    all_products = []
    for product in suning_list:
        all_products.append(standardize_product(product, '苏宁'))
    for product in pdd_list:
        all_products.append(standardize_product(product, '拼多多'))
    
    # 1. 先按品牌粗分组
    brand_groups = defaultdict(list)
    for idx, product in enumerate(all_products):
        brand = product['brand'] if product['brand'] else '未知'
        brand_groups[brand].append((idx, product))
    
    # 2. 每个品牌组内再用ProductMatcher细分
    groups = defaultdict(list)
    used_products = set()
    group_id = 1
    for brand, prod_list in brand_groups.items():
        n = len(prod_list)
        for i in range(n):
            idx1, product1 = prod_list[i]
            if idx1 in used_products:
                continue
            group_key = f"group_{group_id}"
            groups[group_key].append(product1)
            used_products.add(idx1)
            for j in range(i+1, n):
                idx2, product2 = prod_list[j]
                if idx2 in used_products:
                    continue
                match_result = matcher.is_same_product(product1, product2)
                if match_result['is_same']:
                    groups[group_key].append(product2)
                    used_products.add(idx2)
            group_id += 1
    
    # 3. 把未分组的商品单独成组（如品牌未知）
    for idx, product in enumerate(all_products):
        if idx not in used_products:
            group_key = f"group_{group_id}"
            groups[group_key].append(product)
            group_id += 1
    return groups

def print_group_debug_info(groups):
    """打印分组调试信息"""
    print("\n===== 商品分组对比调试信息 =====")
    for idx, (key, group) in enumerate(groups.items(), 1):
        # 检查是否为跨平台商品组
        platforms = set(g['platform'] for g in group)
        is_cross_platform = len(platforms) > 1
        platform_label = "【跨平台】" if is_cross_platform else "【单平台】"
        
        print(f"\n分组{idx}: {key} {platform_label}")
        print(f"  平台分布: {', '.join(platforms)}")
        
        # 统计品牌分布
        brands = set(g['original_data'].get('brand', '未知') for g in group)
        print(f"  品牌分布: {', '.join(brands)}")
        
        # 价格统计
        prices = [float(g['original_data'].get('goods_price', 0)) for g in group]
        max_price = max(prices)
        min_price = min(prices)
        max_item = group[prices.index(max_price)]
        min_item = group[prices.index(min_price)]
        
        print(f"  商品数量: {len(group)}")
        print(f"  价格范围: {min_price:.2f} - {max_price:.2f}")
        print(f"  最高价: {max_item['original_data'].get('goods_price')} | 标题: {max_item['original_data'].get('goods_title')} | 平台: {max_item['original_data'].get('shop_platform')}")
        print(f"  最低价: {min_item['original_data'].get('goods_price')} | 标题: {min_item['original_data'].get('goods_title')} | 平台: {min_item['original_data'].get('shop_platform')}")
        print("  所有商品:")
        for g in group:
            original = g['original_data']
            print(f"    - {original.get('shop_platform')} | {original.get('brand')} | {original.get('goods_title')} | {original.get('goods_price')}")
    
    print("\n===== 结束 =====\n")

def save_goods_to_csv(goods_list, filename='compared_goods.csv'):
    """保存最低价商品到CSV"""
    if not goods_list:
        return False
    
    fieldnames = [
        'goods_img', 'goods_title', 'goods_price', 'goods_sales',
        'shop_title', 'shop_platform', 'goods_link', 'grab_time',
        'page_type', 'search_keyword', 'brand'
    ]
    
    with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        for row in goods_list:
            writer.writerow({k: row.get(k, '') for k in fieldnames})
    
    return True

def compare_and_save(suning_list, pdd_list, csv_filename='compared_goods.csv'):
    """
    综合流程：使用ProductMatcher分组、筛选最低价、保存到CSV，返回最低价商品列表和调试信息
    优先显示跨平台商品
    """
    # 数据标准化清洗
    suning_list = [standardize_product_data(item) for item in suning_list]
    pdd_list = [standardize_product_data(item) for item in pdd_list]
    
    # 使用ProductMatcher进行分组
    groups = group_products_by_similarity(suning_list, pdd_list)
    
    # 筛选每组最低价商品，并优先跨平台商品
    min_goods = []
    debug_info = []
    
    # 分离跨平台商品组和单平台商品组
    cross_platform_groups = []
    single_platform_groups = []
    
    for key, group in groups.items():
        # 检查是否为跨平台商品组
        platforms = set(g['platform'] for g in group)
        is_cross_platform = len(platforms) > 1
        
        prices = [float(g['original_data'].get('goods_price', 0)) for g in group]
        min_item = group[prices.index(min(prices))]
        
        # 收集调试信息
        brands = set(g['original_data'].get('brand', '未知') for g in group)
        group_info = {
            'group_key': key,
            'brands': list(brands),
            'max_price': max(prices),
            'min_price': min(prices),
            'max_item': group[prices.index(max(prices))]['original_data'],
            'min_item': min_item['original_data'],
            'count': len(group),
            'all_items': [g['original_data'] for g in group],
            'is_cross_platform': is_cross_platform,
            'platforms': list(platforms)
        }
        
        if is_cross_platform:
            cross_platform_groups.append((key, group, min_item, group_info))
        else:
            single_platform_groups.append((key, group, min_item, group_info))
    
    # 优先添加跨平台商品，然后添加单平台商品
    for key, group, min_item, group_info in cross_platform_groups + single_platform_groups:
        min_goods.append(min_item['original_data'])
        debug_info.append(group_info)
    
    # 保存到CSV
    save_goods_to_csv(min_goods, filename=csv_filename)
    
    # 打印调试信息
    print_group_debug_info(groups)
    
    # 打印跨平台统计信息
    print(f"\n===== 跨平台商品统计 =====")
    print(f"跨平台商品组数量: {len(cross_platform_groups)}")
    print(f"单平台商品组数量: {len(single_platform_groups)}")
    print(f"总商品组数量: {len(groups)}")
    print(f"跨平台商品占比: {len(cross_platform_groups)/len(groups)*100:.1f}%")
    print("===== 结束 =====\n")
    
    return min_goods, debug_info

def simple_mix_products(suning_list, pdd_list, mix_ratio=None):
    """
    简单混合商品数据
    :param suning_list: 苏宁商品列表
    :param pdd_list: 拼多多商品列表
    :param mix_ratio: 混合比例，如 {'苏宁': 0.4, '拼多多': 0.6}，默认随机混合
    :return: 混合后的商品列表
    """
    print("🎲 开始简单混合商品数据...")
    
    # 数据标准化
    suning_list = [standardize_product_data(item) for item in suning_list]
    pdd_list = [standardize_product_data(item) for item in pdd_list]
    
    print(f"原始数据: 苏宁 {len(suning_list)} 个, 拼多多 {len(pdd_list)} 个")
    
    # 合并所有商品
    all_products = []
    
    # 添加苏宁商品
    for product in suning_list:
        all_products.append(product)
    
    # 添加拼多多商品
    for product in pdd_list:
        all_products.append(product)
    
    # 随机打乱顺序
    import random
    random.shuffle(all_products)
    
    print(f"混合完成: 总共 {len(all_products)} 个商品")
    
    # 统计平台分布
    suning_count = len([p for p in all_products if p['shop_platform'] == '苏宁'])
    pdd_count = len([p for p in all_products if p['shop_platform'] == '拼多多'])
    
    print(f"混合后分布: 苏宁 {suning_count} 个, 拼多多 {pdd_count} 个")
    
    return all_products

def smart_mix_products(suning_list, pdd_list, target_ratio=None):
    """
    智能混合商品数据（保持指定比例）
    :param suning_list: 苏宁商品列表
    :param pdd_list: 拼多多商品列表
    :param target_ratio: 目标比例，如 {'苏宁': 0.4, '拼多多': 0.6}
    :return: 混合后的商品列表
    """
    print("🎯 开始智能混合商品数据...")
    
    # 数据标准化
    suning_list = [standardize_product_data(item) for item in suning_list]
    pdd_list = [standardize_product_data(item) for item in pdd_list]
    
    print(f"原始数据: 苏宁 {len(suning_list)} 个, 拼多多 {len(pdd_list)} 个")
    
    # 如果没有指定比例，使用随机混合
    if not target_ratio:
        return simple_mix_products(suning_list, pdd_list)
    
    # 计算目标数量
    total_count = len(suning_list) + len(pdd_list)
    target_suning_count = int(total_count * target_ratio.get('苏宁', 0.5))
    target_pdd_count = total_count - target_suning_count
    
    # 随机选择商品
    import random
    
    # 随机选择苏宁商品
    selected_suning = random.sample(suning_list, min(target_suning_count, len(suning_list)))
    
    # 随机选择拼多多商品
    selected_pdd = random.sample(pdd_list, min(target_pdd_count, len(pdd_list)))
    
    # 合并并随机打乱
    mixed_products = selected_suning + selected_pdd
    random.shuffle(mixed_products)
    
    print(f"智能混合完成: 总共 {len(mixed_products)} 个商品")
    
    # 统计实际分布
    actual_suning_count = len([p for p in mixed_products if p['shop_platform'] == '苏宁'])
    actual_pdd_count = len([p for p in mixed_products if p['shop_platform'] == '拼多多'])
    
    print(f"目标比例: 苏宁 {target_ratio.get('苏宁', 0.5):.1%}, 拼多多 {target_ratio.get('拼多多', 0.5):.1%}")
    print(f"实际分布: 苏宁 {actual_suning_count} 个, 拼多多 {actual_pdd_count} 个")
    
    return mixed_products

def mix_and_save_csv(suning_list, pdd_list, csv_filename='mixed_goods.csv', mix_mode='simple'):
    """
    清洗：商品数据并保存到CSV
    :param suning_list: 苏宁商品列表
    :param pdd_list: 拼多多商品列表
    :param csv_filename: 输出CSV文件名
    :param mix_mode: 混合模式 ('simple', 'smart', 'balanced')
    :return: 混合后的商品列表
    """
    print(f"🔄 开始混合商品数据 (模式: {mix_mode})...")
    
    if mix_mode == 'simple':
        mixed_products = simple_mix_products(suning_list, pdd_list)
    elif mix_mode == 'smart':
        # 智能混合：拼多多稍多
        mixed_products = smart_mix_products(suning_list, pdd_list, {'苏宁': 0.4, '拼多多': 0.6})
    elif mix_mode == 'balanced':
        # 平衡混合：各占一半
        mixed_products = smart_mix_products(suning_list, pdd_list, {'苏宁': 0.5, '拼多多': 0.5})
    else:
        mixed_products = simple_mix_products(suning_list, pdd_list)
    
    # 保存到CSV
    if save_goods_to_csv(mixed_products, filename=csv_filename):
        print(f"✅ 混合数据已保存到 {csv_filename}")
    else:
        print("❌ 保存CSV文件失败")
    
    return mixed_products
