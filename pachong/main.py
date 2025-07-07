import os
import sys
import csv

# 1. 初始化 Django 环境
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pachong.settings')
import django
django.setup()

# 2. 导入Django相关内容
from app01.grab_goods.sn import crawler as sn_crawler
from app01.grab_goods.pdd_goods import search_goods_with_login as pdd_crawler, save_to_csv_pdd
from app01.utils.compare import simple_mix_products, smart_mix_products
from app01.models import Goods
from django.utils.dateparse import parse_datetime


def import_csv_to_db(csv_file, keyword):
    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            # 避免重复
            if Goods.objects.filter(goods_title=row['goods_title'], shop_platform=row['shop_platform'], goods_link=row['goods_link']).exists():
                continue
            grab_time = parse_datetime(row['grab_time']) if row['grab_time'] else None
            Goods.objects.create(
                goods_img=row['goods_img'],
                goods_title=row['goods_title'],
                goods_price=row['goods_price'],
                goods_sales=row['goods_sales'],
                shop_title=row['shop_title'],
                shop_platform=row['shop_platform'],
                goods_link=row['goods_link'],
                grab_time=grab_time,
                search_keyword=keyword
            )
            count += 1
        print(f"成功导入 {count} 条数据到数据库")

if __name__ == "__main__":
    keyword = input("请输入搜索关键词（默认：手机）: ").strip() or "手机"
    mix_mode = input("混合模式（simple/smart/balanced，默认simple）: ").strip() or "simple"

    print("开始爬取苏宁...")
    sn_result = sn_crawler(goods_word=keyword, max_pages=2, fast_mode=True)
    print(f"苏宁商品数: {len(sn_result)}")

    print("开始爬取拼多多...")
    pdd_result = pdd_crawler(keyword=keyword, page=1, size=100)
    print(f"拼多多商品数: {len(pdd_result)}")

    # 混合
    if mix_mode == "simple":
        mixed = simple_mix_products(sn_result, pdd_result)
    elif mix_mode == "smart":
        mixed = smart_mix_products(sn_result, pdd_result, {'苏宁': 0.4, '拼多多': 0.6})
    elif mix_mode == "balanced":
        mixed = smart_mix_products(sn_result, pdd_result, {'苏宁': 0.5, '拼多多': 0.5})
    else:
        mixed = simple_mix_products(sn_result, pdd_result)

    print(f"混合后商品数: {len(mixed)}")

    # 保存为CSV
    out_csv = f"mixed_{keyword}.csv"
    save_to_csv_pdd(mixed, filename=out_csv, search_keyword=keyword)
    print(f"已保存到 {out_csv}")

    # 导入数据库
    import_csv_to_db(out_csv, keyword)
