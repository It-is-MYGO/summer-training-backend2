#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试修复后的AI分类功能
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app01.grab_goods.sn import classify_with_ai, get_category_from_title
import time

def test_ai_classification():
    """测试AI分类功能"""
    
    # 测试用例
    test_cases = [
        {
            "title": "华为Mate60 Pro手机 5G智能手机",
            "brand": "华为",
            "expected": "手机数码"
        },
        {
            "title": "李宁运动鞋男2024新款跑步鞋",
            "brand": "李宁",
            "expected": "运动户外"
        },
        {
            "title": "苹果iPhone15手机壳",
            "brand": "苹果",
            "expected": "手机数码"
        },
        {
            "title": "耐克篮球鞋Nike Air Jordan",
            "brand": "耐克",
            "expected": "运动户外"
        },
        {
            "title": "小米平板电脑iPad Pro",
            "brand": "小米",
            "expected": "手机数码"
        }
    ]
    
    print("🧪 测试修复后的智谱AI商品分类功能...")
    print("=" * 60)
    
    ai_success = 0
    traditional_success = 0
    total_tests = len(test_cases)
    
    for i, test_case in enumerate(test_cases, 1):
        title = test_case["title"]
        brand = test_case["brand"]
        expected = test_case["expected"]
        
        print(f"\n📦 测试 {i}/{total_tests}")
        print(f"商品标题: {title}")
        print(f"品牌: {brand}")
        print(f"期望分类: {expected}")
        
        # 测试AI分类
        try:
            print("🤖 使用AI分类...")
            ai_start_time = time.time()
            ai_category = classify_with_ai(title, brand)
            ai_time = time.time() - ai_start_time
            
            print(f"AI分类结果: {ai_category} (耗时: {ai_time:.2f}秒)")
            
            if ai_category == expected:
                ai_success += 1
                print("✅ AI分类正确")
            else:
                print("❌ AI分类错误")
                
        except Exception as e:
            print(f"❌ AI分类异常: {e}")
        
        # 测试传统分类
        try:
            print("🔧 使用传统分类...")
            traditional_start_time = time.time()
            traditional_category = get_category_from_title(title, brand)
            traditional_time = time.time() - traditional_start_time
            
            print(f"传统分类结果: {traditional_category} (耗时: {traditional_time:.2f}秒)")
            
            if traditional_category == expected:
                traditional_success += 1
                print("✅ 传统分类正确")
            else:
                print("❌ 传统分类错误")
                
        except Exception as e:
            print(f"❌ 传统分类异常: {e}")
        
        print("-" * 40)
        
        # 添加延迟避免API限制
        if i < total_tests:
            print("⏳ 等待2秒...")
            time.sleep(2)
    
    # 统计结果
    print("\n" + "=" * 60)
    print("📊 测试结果统计")
    print("=" * 60)
    
    ai_accuracy = (ai_success / total_tests) * 100
    traditional_accuracy = (traditional_success / total_tests) * 100
    
    print(f"AI分类准确率: {ai_success}/{total_tests} ({ai_accuracy:.1f}%)")
    print(f"传统分类准确率: {traditional_success}/{total_tests} ({traditional_accuracy:.1f}%)")
    
    if ai_accuracy > traditional_accuracy:
        print("🎉 AI分类效果优于传统方法！")
    elif ai_accuracy < traditional_accuracy:
        print("⚠️ 传统分类效果优于AI方法")
    else:
        print("🤝 AI分类与传统方法效果相当")

def test_single_case():
    """测试单个案例"""
    print("\n🎯 测试单个案例...")
    
    title = "华为Mate60 Pro手机 5G智能手机"
    brand = "华为"
    
    print(f"商品标题: {title}")
    print(f"品牌: {brand}")
    
    try:
        result = classify_with_ai(title, brand)
        print(f"AI分类结果: {result}")
        
        if result != "未分类":
            print("✅ AI分类成功!")
        else:
            print("❌ AI分类失败，返回未分类")
            
    except Exception as e:
        print(f"❌ AI分类异常: {e}")

if __name__ == "__main__":
    print("🎯 修复后的智谱AI商品分类测试")
    print("=" * 60)
    
    # 测试单个案例
    test_single_case()
    
    # 完整测试
    test_ai_classification()
    
    print("\n✨ 测试完成！") 