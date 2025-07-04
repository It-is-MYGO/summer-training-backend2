# app01/api/views.py

from django.core.cache import cache
from django.http import JsonResponse
from app01.grab_goods.sn_goods import crawler
from app01.models import Goods
from django.views.decorators.csrf import csrf_exempt
from django.utils.dateparse import parse_datetime

@csrf_exempt
def crawl_view(request):
    keyword = request.GET.get('keyword', '')
    cache_key = f"spider:{keyword}"
    data = cache.get(cache_key)
    if data:
        return JsonResponse({"data": data, "from_cache": True})

    # 缓存没有，查数据库
    goods = Goods.objects.filter(goods_title__icontains=keyword).first()
    if goods:
        data = {
            "goods_img": goods.goods_img,
            "goods_title": goods.goods_title,
            "goods_price": float(goods.goods_price),
            "goods_sales": goods.goods_sales,
            "shop_title": goods.shop_title,
            "shop_platform": goods.shop_platform,
            "goods_link": goods.goods_link,
            "grab_time": goods.grab_time.strftime("%Y-%m-%d %H:%M:%S"),
        }
        cache.set(cache_key, data, timeout=600)
        return JsonResponse({"data": data, "from_cache": False, "from_db": True})

    # 数据库也没有，调用爬虫
    result = run_spider(keyword)
    cache.set(cache_key, result, timeout=600)
    # 可选：存入数据库
    if result:
        Goods.objects.create(
            goods_img=result["goods_img"],
            goods_title=result["goods_title"],
            goods_price=result["goods_price"],
            goods_sales=result["goods_sales"],
            shop_title=result["shop_title"],
            shop_platform=result["shop_platform"],
            goods_link=result["goods_link"],
            grab_time=parse_datetime(result["grab_time"])
        )
    return JsonResponse({"data": result, "from_cache": False, "from_db": False})
