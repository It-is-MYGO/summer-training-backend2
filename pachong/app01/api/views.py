# app01/api/views.py

from django.core.cache import cache
from django.http import JsonResponse
from app01.grab_goods.sn import crawler as sn_crawler
from app01.grab_goods.pdd_goods import search_goods_with_login as pdd_crawler
from app01.models import Goods
from django.views.decorators.csrf import csrf_exempt
from django.utils.dateparse import parse_datetime
from app01.utils.compare import compare_and_save, simple_mix_products, smart_mix_products, mix_and_save_csv
import json
from datetime import datetime

# 缓存配置说明：
# 使用Django默认内存缓存，无需额外安装Redis
# 缓存数据存储在内存中，服务器重启后缓存会清空
# 适合开发环境和简单部署场景

def format_response_data(data):
    """格式化返回给前端的数据"""
    if not data:
        return []
    
    formatted = []
    for item in data:
        formatted_item = {
            'goods_img': str(item.get('goods_img', '')),
            'goods_title': str(item.get('goods_title', '')).strip(),
            'goods_price': float(item.get('goods_price', 0)),
            'goods_sales': str(item.get('goods_sales', '0')),
            'shop_title': str(item.get('shop_title', '')).strip(),
            'shop_platform': str(item.get('shop_platform', '')).strip(),
            'goods_link': str(item.get('goods_link', '')),
            'grab_time': str(item.get('grab_time', '')),
            'page_type': str(item.get('page_type', 'product')),
            'search_keyword': str(item.get('search_keyword', '')).strip(),
            'brand': str(item.get('brand', '未知')).strip()
        }
        formatted.append(formatted_item)
    
    return formatted

def save_to_database(products, keyword):
    """将混合后的数据保存到数据库"""
    saved_count = 0
    for product in products:
        try:
            # 检查是否已存在相同商品
            existing = Goods.objects.filter(
                goods_title=product['goods_title'],
                shop_platform=product['shop_platform'],
                goods_link=product['goods_link']
            ).first()
            
            if not existing:
                # 解析时间
                grab_time = None
                if 'grab_time' in product and product['grab_time']:
                    try:
                        grab_time = parse_datetime(product['grab_time'])
                    except:
                        grab_time = datetime.now()
                
                # 创建新记录
                Goods.objects.create(
                    goods_img=product['goods_img'],
                    goods_title=product['goods_title'],
                    goods_price=product['goods_price'],
                    goods_sales=product['goods_sales'],
                    shop_title=product['shop_title'],
                    shop_platform=product['shop_platform'],
                    goods_link=product['goods_link'],
                    grab_time=grab_time,
                    search_keyword=keyword
                )
                saved_count += 1
        except Exception as e:
            print(f"保存商品到数据库失败: {e}")
            continue
    
    return saved_count

@csrf_exempt
def crawl_and_mix_view(request):
    """
    """
    if request.method == 'GET':
        keyword = request.GET.get('keyword', '')
        mix_mode = request.GET.get('mode', 'simple')  # simple, smart, balanced
        save_to_db = request.GET.get('save', 'true').lower() == 'true'
        
        if not keyword:
            return JsonResponse({
                "success": False,
                "message": "请提供搜索关键词",
                "data": []
            })
        
        # 1. 检查缓存
        cache_key = f"crawl_mix:{keyword}:{mix_mode}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return JsonResponse({
                "success": True,
                "message": "从缓存获取数据",
                "data": cached_data,
                "from_cache": True,
                "saved_to_db": False
            })
        
        try:
            # 2. 调用爬虫获取数据
            print(f"🕷️ 开始爬取关键词: {keyword}")
            sn_result = sn_crawler(goods_word=keyword, max_pages=2, fast_mode=True)
            pdd_result = pdd_crawler(keyword=keyword, page=1, size=10)
            
            print(f"📊 爬虫结果 - 苏宁: {len(sn_result)}个, 拼多多: {len(pdd_result)}个")
            
            # 3. 清洗数据
            print(f"🔄 开始清洗数据，模式: {mix_mode}")
            if mix_mode == 'simple':
                mixed_products = simple_mix_products(sn_result, pdd_result)
            elif mix_mode == 'smart':
                mixed_products = smart_mix_products(sn_result, pdd_result, {'苏宁': 0.4, '拼多多': 0.6})
            elif mix_mode == 'balanced':
                mixed_products = smart_mix_products(sn_result, pdd_result, {'苏宁': 0.5, '拼多多': 0.5})
            else:
                mixed_products = simple_mix_products(sn_result, pdd_result)
            
            print(f"✅ 清洗完成，共{len(mixed_products)}个商品")
            
            # 4. 格式化数据
            formatted_products = format_response_data(mixed_products)
            
            # 5. 存储到数据库
            saved_count = 0
            if save_to_db and formatted_products:
                print(f"💾 开始保存到数据库...")
                saved_count = save_to_database(formatted_products, keyword)
                print(f"✅ 成功保存{saved_count}个商品到数据库")
            
            # 6. 缓存结果
            cache.set(cache_key, formatted_products, timeout=1800)  # 30分钟缓存
            
            # 7. 统计信息
            suning_count = len([p for p in formatted_products if p['shop_platform'] == '苏宁'])
            pdd_count = len([p for p in formatted_products if p['shop_platform'] == '拼多多'])
            
            return JsonResponse({
                "success": True,
                "message": f"成功获取{len(formatted_products)}个商品",
                "data": formatted_products,
                "total_count": len(formatted_products),
                "mix_mode": mix_mode,
                "stats": {
                    "suning_count": suning_count,
                    "pdd_count": pdd_count,
                    "suning_ratio": suning_count / len(formatted_products) if formatted_products else 0,
                    "pdd_ratio": pdd_count / len(formatted_products) if formatted_products else 0
                },
                "saved_to_db": save_to_db,
                "saved_count": saved_count,
                "from_cache": False
            })
            
        except Exception as e:
            print(f"❌ API处理失败: {e}")
            return JsonResponse({
                "success": False,
                "message": f"处理失败: {str(e)}",
                "data": []
            })
    
    elif request.method == 'POST':
        # POST请求处理
        try:
            data = json.loads(request.body)
            keyword = data.get('keyword', '')
            mix_mode = data.get('mode', 'simple')
            save_to_db = data.get('save', True)
            
            if not keyword:
                return JsonResponse({
                    "success": False,
                    "message": "请提供搜索关键词",
                    "data": []
                })
            
            # 使用GET相同的处理逻辑
            request.GET = request.GET.copy()
            request.GET['keyword'] = keyword
            request.GET['mode'] = mix_mode
            request.GET['save'] = str(save_to_db).lower()
            
            return crawl_and_mix_view(request)
            
        except json.JSONDecodeError:
            return JsonResponse({
                "success": False,
                "message": "JSON格式错误",
                "data": []
            })
        except Exception as e:
            return JsonResponse({
                "success": False,
                "message": f"处理失败: {str(e)}",
                "data": []
            })

@csrf_exempt
def get_database_products(request):
    """从数据库获取已保存的商品数据"""
    keyword = request.GET.get('keyword', '')
    platform = request.GET.get('platform', '')  # 可选筛选平台
    
    try:
        query = Goods.objects.all()
        
        if keyword:
            query = query.filter(goods_title__icontains=keyword)
        
        if platform:
            query = query.filter(shop_platform=platform)
        
        # 限制返回数量
        products = query.order_by('-grab_time')[:100]
        
        formatted_products = []
        for product in products:
            formatted_products.append({
                'goods_img': product.goods_img,
                'goods_title': product.goods_title,
                'goods_price': float(product.goods_price),
                'goods_sales': product.goods_sales,
                'shop_title': product.shop_title,
                'shop_platform': product.shop_platform,
                'goods_link': product.goods_link,
                'grab_time': product.grab_time.strftime("%Y-%m-%d %H:%M:%S") if product.grab_time else '',
                'search_keyword': product.search_keyword if hasattr(product, 'search_keyword') else ''
            })
        
        return JsonResponse({
            "success": True,
            "message": f"从数据库获取{len(formatted_products)}个商品",
            "data": formatted_products,
            "total_count": len(formatted_products),
            "from_database": True
        })
        
    except Exception as e:
        return JsonResponse({
            "success": False,
            "message": f"获取数据库数据失败: {str(e)}",
            "data": []
        })

@csrf_exempt
def clear_cache_view(request):
    """清除缓存"""
    try:
        cache.clear()
        return JsonResponse({
            "success": True,
            "message": "缓存已清除"
        })
    except Exception as e:
        return JsonResponse({
            "success": False,
            "message": f"清除缓存失败: {str(e)}"
        })

# # 保留原有的API接口作为备用
# @csrf_exempt
# def crawl_view(request):
#     """原始爬虫API（保留兼容性）"""
#     keyword = request.GET.get('keyword', '')
#     cache_key = f"spider:{keyword}"
#     data = cache.get(cache_key)
#     if data:
#         return JsonResponse({"data": data, "from_cache": True})

#     # 缓存没有，查数据库
#     goods = Goods.objects.filter(goods_title__icontains=keyword).first()
#     if goods:
#         data = {
#             "goods_img": goods.goods_img,
#             "goods_title": goods.goods_title,
#             "goods_price": float(goods.goods_price),
#             "goods_sales": goods.goods_sales,
#             "shop_title": goods.shop_title,
#             "shop_platform": goods.shop_platform,
#             "goods_link": goods.goods_link,
#             "grab_time": goods.grab_time.strftime("%Y-%m-%d %H:%M:%S"),
#         }
#         cache.set(cache_key, data, timeout=600)
#         return JsonResponse({"data": data, "from_cache": False, "from_db": True})

#     # 数据库也没有，调用爬虫（苏宁和拼多多）
#     sn_result = sn_crawler(goods_word=keyword, max_pages=2, fast_mode=True)
#     pdd_result = pdd_crawler(keyword=keyword, page=1, size=10)
    
#     # 对比并筛选最低价商品
#     min_goods, debug_info = compare_and_save(sn_result, pdd_result, csv_filename='compared_goods.csv')
    
#     # 格式化返回数据
#     result = {
#         "suning": format_response_data(sn_result), 
#         "pdd": format_response_data(pdd_result)
#     }
#     min_goods_formatted = format_response_data(min_goods)
    
#     cache.set(cache_key, result, timeout=600)
    
#     return JsonResponse({
#         "data": result, 
#         "min_goods": min_goods_formatted, 
#         "from_cache": False, 
#         "from_db": False
#     })

# @csrf_exempt
# def smart_mix_view(request):
#     """智能混合API接口"""
#     keyword = request.GET.get('keyword', '')
#     mix_mode = request.GET.get('mode', 'smart')  # smart, random, balanced
    
#     cache_key = f"smart_mix:{keyword}:{mix_mode}"
#     data = cache.get(cache_key)
#     if data:
#         return JsonResponse({"data": data, "from_cache": True})

#     # 调用爬虫获取数据
#     sn_result = sn_crawler(goods_word=keyword, max_pages=2, fast_mode=True)
#     pdd_result = pdd_crawler(keyword=keyword, page=1, size=10)
    
#     # 执行智能混合算法
#     mixed_products = smart_mix_products(sn_result, pdd_result)
    
#     # 格式化返回数据
#     formatted_mixed = format_response_data(mixed_products)
    
#     # 缓存结果
#     cache.set(cache_key, formatted_mixed, timeout=600)
    
#     return JsonResponse({
#         "data": formatted_mixed,
#         "total_count": len(formatted_mixed),
#         "mix_mode": mix_mode,
#         "from_cache": False
#     })

