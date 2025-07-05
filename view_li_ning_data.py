#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pymysql

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '123456',
    'database': 'pricecompare',
    'charset': 'utf8mb4'
}

def view_li_ning_data():
    """查看李宁品牌的数据"""
    try:
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("="*60)
        print("李宁品牌数据查看")
        print("="*60)
        
        # 1. 查看李宁品牌信息
        print("1. 李宁品牌信息:")
        cursor.execute("SELECT * FROM brands WHERE name = '李宁'")
        brand = cursor.fetchone()
        if brand:
            print(f"   品牌ID: {brand[0]}")
            print(f"   品牌名称: {brand[1]}")
        else:
            print("   未找到李宁品牌")
        print()
        
        # 2. 查看李宁的商品数量
        print("2. 李宁商品统计:")
        cursor.execute("SELECT COUNT(*) FROM products WHERE brand_id = %s", (brand[0] if brand else 0,))
        product_count = cursor.fetchone()[0]
        print(f"   商品总数: {product_count}")
        print()
        
        # 3. 查看最新的李宁商品
        print("3. 最新李宁商品 (前10个):")
        cursor.execute("""
            SELECT id, title, current_price, category, created_at 
            FROM products 
            WHERE brand_id = %s 
            ORDER BY id DESC 
            LIMIT 10
        """, (brand[0] if brand else 0,))
        
        products = cursor.fetchall()
        for i, product in enumerate(products, 1):
            print(f"   {i}. ID: {product[0]}")
            print(f"      标题: {product[1]}")
            print(f"      价格: {product[2]}")
            print(f"      分类: {product[3]}")
            print(f"      创建时间: {product[4]}")
            print()
        
        # 4. 查看价格历史
        print("4. 价格历史记录 (前5个):")
        cursor.execute("""
            SELECT pp.id, p.title, pp.platform, pp.price, pp.date
            FROM product_prices pp
            JOIN products p ON pp.product_id = p.id
            WHERE p.brand_id = %s
            ORDER BY pp.id DESC
            LIMIT 5
        """, (brand[0] if brand else 0,))
        
        prices = cursor.fetchall()
        for i, price in enumerate(prices, 1):
            print(f"   {i}. 价格ID: {price[0]}")
            print(f"      商品: {price[1][:50]}...")
            print(f"      平台: {price[2]}")
            print(f"      价格: {price[3]}")
            print(f"      日期: {price[4]}")
            print()
        
        # 5. 按分类统计
        print("5. 按分类统计:")
        cursor.execute("""
            SELECT category, COUNT(*) as count
            FROM products
            WHERE brand_id = %s
            GROUP BY category
        """, (brand[0] if brand else 0,))
        
        categories = cursor.fetchall()
        for category in categories:
            print(f"   {category[0]}: {category[1]}个商品")
        print()
        
        # 6. 价格范围统计
        print("6. 价格范围统计:")
        cursor.execute("""
            SELECT 
                MIN(current_price) as min_price,
                MAX(current_price) as max_price,
                AVG(current_price) as avg_price
            FROM products
            WHERE brand_id = %s
        """, (brand[0] if brand else 0,))
        
        price_stats = cursor.fetchone()
        if price_stats:
            print(f"   最低价格: {price_stats[0]}")
            print(f"   最高价格: {price_stats[1]}")
            print(f"   平均价格: {price_stats[2]:.2f}")
        print()
        
        connection.close()
        print("="*60)
        print("数据查看完成")
        
    except Exception as e:
        print(f"❌ 查看数据失败: {str(e)}")

if __name__ == "__main__":
    view_li_ning_data() 