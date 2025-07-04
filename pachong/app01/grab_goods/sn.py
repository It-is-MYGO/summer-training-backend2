from lxml import etree
from time import sleep
from app01.utils.utils_func import draw_num, avoid_check
import time
import random
import csv
from datetime import datetime
import re
import pymysql

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
            bro.get(url)
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
    
    # 解析商品信息
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
            
            # 添加到结果列表
            goods_info.append({
                'goods_img': goods_img,
                'goods_title': goods_title[:127],  # 限制标题长度
                'goods_price': float(goods_price),
                'goods_sales': goods_sales.replace('+', '') if goods_sales else '0',
                'shop_title': goods_shop,
                'shop_platform': '苏宁',
                'goods_link': goods_link,
                'grab_time': time.strftime('%Y-%m-%d %H:%M', time.localtime()),
                'page_type': page_type  # 添加页面类型标识
            })
        except Exception as e:
            print(f"解析商品时出错: {str(e)}")
            continue
    
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
        'goods_link', 'grab_time', 'page_type'
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
                        'page_type': row.get('page_type', 'product')
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

def write_to_mysql(goods):
    conn = pymysql.connect(
        host='localhost',
        user='root',
        password='123456',
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
    category = '未分类'
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
    # 支持批量关键词采集
    keywords = ["李宁", "耐克", "阿迪达斯", "安踏", "特步", "鸿星尔克", "匹克", "乔丹", "彪马", "斐乐"]
    total_count = 0
    for word in keywords:
        print(f"\n开始采集关键词：{word}")
        sn_goods_info = crawler(goods_word=word)
        save_to_csv(sn_goods_info, filename=f'suning_products_{word}.csv')
        print(f"共获取 {len(sn_goods_info)} 条商品数据 for {word}")
        for idx, item in enumerate(sn_goods_info[:3], 1):  # 打印前3条作为示例
            print(f"\n商品 {idx}:")
            print(f"类型: {'商品页' if item['page_type'] == 'product' else '品牌页'}")
            print(f"标题: {item['goods_title']}")
            print(f"价格: {item['goods_price']}")
            print(f"销量: {item['goods_sales']}")
            print(f"店铺: {item['shop_title']}")
            print(f"链接: {item['goods_link']}")
        # 新增：写入数据库
        for item in sn_goods_info:
            write_to_mysql(item)
        total_count += len(sn_goods_info)
    print(f"已写入 {total_count} 条商品数据到数据库 products 和 product_prices 表。")
