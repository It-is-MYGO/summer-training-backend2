from lxml import etree
from time import sleep
from app01.utils.utils_func import draw_num, avoid_check
import time
import random
import csv
from datetime import datetime
import re
import requests
import json
from selenium.webdriver import Edge, EdgeOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.edge.service import Service
import random
from lxml import etree
def get_comments_alternative(shop_id, product_id, max_count=5):
    """
    备用评论获取方法，尝试不同的评论接口
    """
    # 尝试不同的评论接口格式
    urls = [
        f"https://review.suning.com/ajax/review_lists/general-{shop_id}-{product_id}-total-5-default-10-----reviewList.htm",
        f"https://review.suning.com/ajax/review_lists/{shop_id}-{product_id}.htm",
        f"https://review.suning.com/ajax/review_lists/general-{shop_id}-{product_id}.htm"
    ]
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': f'https://product.suning.com/{shop_id}/{product_id}.html'
    }
    
    for url in urls:
        try:
            print(f"尝试备用评论接口: {url}")
            resp = requests.get(url, headers=headers, timeout=1)
            if resp.status_code == 200:
                text = resp.text
                if text.startswith("reviewList("):
                    text = text[len("reviewList("):-1]
                
                data = json.loads(text)
                if data.get("returnCode") != "1" or data.get("returnMsg") != "无评价数据":
                    comments = []
                    review_list = data.get("commodityReviews", [])
                    for item in review_list[:max_count]:
                        comment_content = item.get("content", "")
                        if comment_content:
                            comments.append(comment_content)
                    if comments:
                        print(f"备用接口成功获取 {len(comments)} 条评论")
                        return comments
        except Exception as e:
            print(f"备用接口失败: {e}")
            continue
    
    return []

def get_comments_with_browser(bro, shop_id, product_id, max_count=5):
    """
    使用已登录的浏览器会话获取评论
    """
    try:
        # 直接访问商品详情页的评论部分
        comment_url = f"https://product.suning.com/{shop_id}/{product_id}.html#review"
        print(f"正在访问评论页面: {comment_url}")
        
        # 保存当前页面URL
        current_url = bro.current_url
        
        # 访问评论页面
        bro.get(comment_url)
        sleep(3)  # 等待页面加载
        
        # 尝试点击"查看全部评论"按钮（如果存在）
        try:
            view_all_btn = bro.find_element('xpath', '//a[contains(text(),"查看全部评论") or contains(text(),"全部评价")]')
            view_all_btn.click()
            sleep(2)
        except:
            print("未找到查看全部评论按钮，继续解析当前页面")
        
        # 解析评论内容
        tree = etree.HTML(bro.page_source)
        comments = []
        
        # 尝试多种评论选择器（苏宁的评论结构可能不同）
        comment_selectors = [
            '//div[contains(@class,"comment-item")]//text()',
            '//div[contains(@class,"review-item")]//text()',
            '//div[contains(@class,"evaluate-item")]//text()',
            '//div[contains(@class,"comment")]//text()',
            '//span[contains(@class,"comment")]//text()',
            '//p[contains(@class,"comment")]//text()'
        ]
        
        for selector in comment_selectors:
            try:
                comment_elements = tree.xpath(selector)
                if comment_elements:
                    print(f"找到评论选择器: {selector}")
                    for comment in comment_elements:
                        comment_text = comment.strip()
                        if comment_text and len(comment_text) > 5:  # 过滤太短的文本
                            comments.append(comment_text)
                            if len(comments) >= max_count:
                                break
                    break
            except Exception as e:
                continue
        
        # 如果上面的方法没找到，尝试更通用的方法
        if not comments:
            print("尝试通用评论提取方法...")
            # 查找包含"评论"、"评价"、"用户"等关键词的文本
            all_texts = tree.xpath('//text()')
            for text in all_texts:
                text = text.strip()
                if text and len(text) > 10 and any(keyword in text for keyword in ['好', '不错', '满意', '推荐', '质量', '价格']):
                    comments.append(text)
                    if len(comments) >= max_count:
                        break
        
        # 返回评论列表
        print(f"成功获取 {len(comments)} 条评论")
        return comments[:max_count]
        
    except Exception as e:
        print(f"浏览器获取评论失败: {e}")
        return []
    finally:
        # 恢复原来的页面（可选）
        try:
            bro.get(current_url)
        except:
            pass

def get_comments(shop_id, product_id, max_count=5):
    """
    爬取苏宁易购商品评论，返回评论内容列表
    """
    url = f"https://review.suning.com/ajax/review_lists/general-{shop_id}-{product_id}-total-5-default-10-----reviewList.htm"
    print(f"正在获取评论，URL: {url}")
    try:
        resp = requests.get(url, timeout=5)
        print(f"评论接口响应状态码: {resp.status_code}")
        if resp.status_code == 200:
            # 去掉 JSONP 包裹
            text = resp.text
            print(f"评论接口返回内容长度: {len(text)}")
            
            if text.startswith("reviewList("):
                text = text[len("reviewList("):-1]
            
            data = json.loads(text)
            
            # 检查是否有评论数据
            if data.get("returnCode") == "1" and data.get("returnMsg") == "无评价数据":
                print("该商品暂无评论数据，尝试备用接口...")
                return get_comments_alternative(shop_id, product_id, max_count)
            
            # 使用正确的字段名 commodityReviews
            comments = []
            review_list = data.get("commodityReviews", [])
            for item in review_list[:max_count]:
                comment_content = item.get("content", "")
                if comment_content:
                    comments.append(comment_content)
            
            print(f"成功获取 {len(comments)} 条评论")
            return comments
        else:
            print(f"评论接口返回错误状态码: {resp.status_code}")
    except Exception as e:
        print(f"获取评论失败: {e}")
    return []
def crawler(goods_word, enable_comments=True):
    """
    爬取苏宁易购商品信息
    :param goods_word: 搜索关键词
    :param enable_comments: 是否启用评论爬取，默认True
    """
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
            # 商品链接和ID（新版优先用href）
            goods_link = ''
            link_shop_id = ''
            link_prd_id = ''
            a_tags = li.xpath('.//div[@class="title-selling-point"]/a')
            if a_tags:
                href = a_tags[0].get('href', '')
                if 'product.suning.com' in href:
                    goods_link = href if href.startswith('http') else 'https:' + href
                    import re
                    m = re.search(r'product\.suning\.com/(\d+)/(\d+)', goods_link)
                    if m:
                        link_shop_id = m.group(1)
                        link_prd_id = m.group(2)
            # 如果没获取到，再用sa-data
            if not link_shop_id or not link_prd_id:
                link_strs = li.xpath('.//div[@class="title-selling-point"]/a/@sa-data')
                if link_strs:
                    link_str = link_strs[0]
                    link_list = link_str.split(',')
                    link_shop_id = draw_num(link_list[2])
                    link_prd_id = draw_num(link_list[1])
                    goods_link = f'https://product.suning.com/{link_shop_id}/{link_prd_id}.html'
            print(f"【DEBUG】goods_link: {goods_link}, shop_id: {link_shop_id}, prd_id: {link_prd_id}")
            comments = []
            if enable_comments and page_type == "product" and link_shop_id and link_prd_id:
                try:
                    comments = get_comments_with_browser(bro, link_shop_id, link_prd_id, max_count=1)
                    if comments:
                        print(f"商品评论: {comments[0]}")
                    else:
                        print("商品无评论")
                except Exception as e:
                    print(f"爬取评论出错: {e}")
            else:
                print("跳过评论爬取")
            # 添加到结果列表
            goods_info.append({
                'goods':{
                    'goods_img': goods_img,
                    'goods_title': goods_title[:127],  # 限制标题长度
                    'goods_price': float(goods_price),
                    'goods_sales': goods_sales.replace('+', '') if goods_sales else '0',
                    'shop_title': goods_shop,
                    'shop_platform': '苏宁',
                    'goods_link': goods_link,
                    'grab_time': time.strftime('%Y-%m-%d %H:%M', time.localtime()),
                    'page_type': page_type
                },
                'comments':comments
            })
        except Exception as e:
            print(f"解析商品时出错: {str(e)}")
            continue
    
    sleep(2)
    bro.quit()
    return goods_info
def save_to_csv(data, filename='suning_products.csv'):
    """将爬取的数据保存为CSV文件"""
    if not data:
        print("没有数据可保存")
        return
    
    # 获取字段名（使用第一条数据的键）
    fieldnames = data[0].keys()
    
    try:
        with open(filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()  # 写入表头
            writer.writerows(data)  # 写入所有数据
        
        print(f"成功保存 {len(data)} 条数据到 {filename}")
    except Exception as e:
        print(f"保存CSV文件时出错: {str(e)}")
# def save_to_csv(data, filename='suning_products.csv'):
#     """
#     将爬取的数据保存为严格符合RFC 4180标准的CSV文件
#     主要改进：
#     1. 严格处理字段中的特殊字符（逗号、换行符、引号）
#     2. 确保所有字段正确引用
#     3. 统一换行符为CRLF
#     4. 正确处理空值和None
#     5. 强制字段顺序一致性
#     """
#     if not data:
#         print("没有数据可保存")
#         return False
    
#     # 定义标准字段顺序
#     standard_fields = [
#         'goods_img', 'goods_title', 'goods_price', 
#         'goods_sales', 'shop_title', 'shop_platform',
#         'goods_link', 'grab_time', 'page_type'
#     ]
    
#     try:
#         with open(filename, 'w', newline='\r\n', encoding='utf-8-sig') as csvfile:
#             writer = csv.DictWriter(
#                 csvfile, 
#                 fieldnames=standard_fields,
#                 delimiter=',',
#                 quoting=csv.QUOTE_ALL,  # 所有字段都用引号包裹，确保安全
#                 quotechar='"',
#                 doublequote=True,  # 使用双引号转义字段内的引号
#                 escapechar=None,   # 禁用反斜杠转义
#                 strict=True        # 严格模式确保字段一致性
#             )
            
#             writer.writeheader()
            
#             success_count = 0
#             for row in data:
#                 try:
#                     # 数据清洗处理
#                     cleaned_row = {
#                         'goods_img': clean_url(row.get('goods_img', '')),
#                         'goods_title': clean_text(row.get('goods_title', ''), max_length=200),
#                         'goods_price': clean_price(row.get('goods_price', 0)),
#                         'goods_sales': clean_sales(row.get('goods_sales', '0')),
#                         'shop_title': clean_text(row.get('shop_title', '未知店铺')),
#                         'shop_platform': row.get('shop_platform', '未知平台'),
#                         'goods_link': clean_url(row.get('goods_link', '')),
#                         'grab_time': row.get('grab_time', datetime.now().strftime('%Y-%m-%d %H:%M:%S')),
#                         'page_type': row.get('page_type', 'product')
#                     }
                    
#                     # 确保所有字段都是字符串且正确处理None值
#                     cleaned_row = {k: '' if v is None else str(v) for k, v in cleaned_row.items()}
                    
#                     writer.writerow(cleaned_row)
#                     success_count += 1
#                 except Exception as e:
#                     print(f"⚠️ 处理数据行时出错（跳过该行）: {str(e)}")
#                     continue
        
#         print(f"✅ 成功保存 {success_count}/{len(data)} 条标准CSV数据到 {filename}")
#         return True
    
#     except Exception as e:
#         print(f"❌ 保存失败: {str(e)}")
#         return False

# def clean_text(text, max_length=200):
#     """严格清洗文本字段，确保符合CSV规范"""
#     if text is None:
#         return ''
    
#     text = str(text).strip()
    
#     # 1. 去除多余空白字符
#     text = ' '.join(text.split())
    
#     # 2. 长度限制
#     if len(text) > max_length:
#         text = text[:max_length-3] + '...'
    
#     # 3. CSV特殊字符已在writer中处理，这里不再重复处理
    
#     return text

# def clean_price(price):
#     """严格价格清洗，返回标准格式字符串"""
#     if price is None:
#         return '0.00'
    
#     try:
#         # 统一转换为浮点数再格式化
#         price_float = float(str(price).replace(',', '').strip())
#         return '{:.2f}'.format(price_float)
#     except (ValueError, TypeError):
#         return '0.00'

# def clean_url(url):
#     """URL标准化处理，确保有效URL"""
#     if url is None:
#         return ''
    
#     url = str(url).strip()
#     if not url:
#         return ''
    
#     if not url.startswith(('http://', 'https://')):
#         return f'https:{url}' if url.startswith('//') else f'https://{url}'
#     return url

# def clean_sales(sales):
#     """销量数据清洗，返回标准格式字符串"""
#     if sales is None:
#         return '0'
    
#     sales = str(sales).strip()
#     sales = re.sub(r'[^0-9]', '', sales)  # 只保留数字
#     return sales if sales else '0'

if __name__ == "__main__":
    word = "李宁"
    sn_goods_info = crawler(goods_word=word)
    save_to_csv(sn_goods_info)
    print(f"共获取 {len(sn_goods_info)} 条商品数据")
    for idx, item in enumerate(sn_goods_info[:3], 1):  # 打印前3条作为示例
        print(f"\n商品 {idx}:")
        goods_data = item['goods']
        print(f"类型: {'商品页' if goods_data['page_type'] == 'product' else '品牌页'}")
        print(f"标题: {goods_data['goods_title']}")
        print(f"价格: {goods_data['goods_price']}")
        print(f"销量: {goods_data['goods_sales']}")
        print(f"店铺: {goods_data['shop_title']}")
        print(f"链接: {goods_data['goods_link']}")
        print(f"评论: {item['comments']}")

                
