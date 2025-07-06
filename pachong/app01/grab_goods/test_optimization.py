# -*- coding: utf-8 -*-
"""
分类优化效果测试脚本
用于验证不同模式下的性能和准确性
"""

import time
import random
from classification_config import set_mode, print_mode_info, MODE_MAP
from sn import classifier, get_category_from_title

# 测试数据
TEST_ITEMS = [
    {'title': '李宁运动鞋男2024新款跑步鞋', 'brand': '李宁'},
    {'title': '耐克篮球鞋男高帮运动鞋', 'brand': '耐克'},
    {'title': '华为手机Mate60 Pro', 'brand': '华为'},
    {'title': '小米平板电脑', 'brand': '小米'},
    {'title': '兰蔻精华液护肤品', 'brand': '兰蔻'},
    {'title': '可口可乐碳酸饮料', 'brand': '可口可乐'},
    {'title': '宜家沙发客厅家具', 'brand': '宜家'},
    {'title': '花王纸尿裤婴儿用品', 'brand': '花王'},
    {'title': '汽车轮胎米其林', 'brand': '米其林'},
    {'title': '同仁堂感冒药', 'brand': '同仁堂'},
    {'title': '苹果iPhone15手机', 'brand': '苹果'},
    {'title': '阿迪达斯运动服套装', 'brand': '阿迪达斯'},
    {'title': '安踏儿童运动鞋', 'brand': '安踏'},
    {'title': '特步跑步鞋女', 'brand': '特步'},
    {'title': '鸿星尔克休闲鞋', 'brand': '鸿星尔克'},
]

def test_single_classification():
    """测试单个分类性能"""
    print("🔍 测试单个分类性能...")
    
    # 测试传统方法
    start_time = time.time()
    traditional_results = []
    for item in TEST_ITEMS:
        result = get_category_from_title(item['title'], item['brand'])
        traditional_results.append(result)
    traditional_time = time.time() - start_time
    
    # 测试优化方法
    start_time = time.time()
    optimized_results = []
    for item in TEST_ITEMS:
        result = classifier.classify_single(item['title'], item['brand'])
        optimized_results.append(result)
    optimized_time = time.time() - start_time
    
    print(f"传统方法耗时: {traditional_time:.3f}秒")
    print(f"优化方法耗时: {optimized_time:.3f}秒")
    print(f"性能提升: {traditional_time/optimized_time:.1f}倍")
    
    return traditional_results, optimized_results

def test_batch_classification():
    """测试批量分类性能"""
    print("\n🔍 测试批量分类性能...")
    
    # 测试批量分类
    start_time = time.time()
    batch_results = classifier.classify_batch_sync(TEST_ITEMS)
    batch_time = time.time() - start_time
    
    print(f"批量分类耗时: {batch_time:.3f}秒")
    print(f"平均每个商品: {batch_time/len(TEST_ITEMS):.3f}秒")
    
    return batch_results

def test_different_modes():
    """测试不同模式的性能"""
    print("\n🚀 测试不同模式的性能...")
    
    results = {}
    
    for mode_name in MODE_MAP.keys():
        print(f"\n测试模式: {mode_name}")
        set_mode(mode_name)
        print_mode_info()
        
        # 清除缓存以公平测试
        classifier.cache.clear()
        
        start_time = time.time()
        mode_results = classifier.classify_batch_sync(TEST_ITEMS)
        mode_time = time.time() - start_time
        
        results[mode_name] = {
            'time': mode_time,
            'results': mode_results,
            'avg_time': mode_time / len(TEST_ITEMS)
        }
        
        print(f"总耗时: {mode_time:.3f}秒")
        print(f"平均耗时: {mode_time/len(TEST_ITEMS):.3f}秒/商品")
    
    return results

def analyze_accuracy(results_dict):
    """分析分类准确性"""
    print("\n📊 分类准确性分析...")
    
    # 预期分类（基于品牌和关键词）
    expected_categories = {
        '李宁运动鞋男2024新款跑步鞋': '运动户外',
        '耐克篮球鞋男高帮运动鞋': '运动户外',
        '华为手机Mate60 Pro': '手机数码',
        '小米平板电脑': '手机数码',
        '兰蔻精华液护肤品': '美妆护肤',
        '可口可乐碳酸饮料': '食品饮料',
        '宜家沙发客厅家具': '家居生活',
        '花王纸尿裤婴儿用品': '母婴用品',
        '汽车轮胎米其林': '汽车用品',
        '同仁堂感冒药': '医药保健',
        '苹果iPhone15手机': '手机数码',
        '阿迪达斯运动服套装': '运动户外',
        '安踏儿童运动鞋': '运动户外',
        '特步跑步鞋女': '运动户外',
        '鸿星尔克休闲鞋': '运动户外',
    }
    
    for mode_name, data in results_dict.items():
        print(f"\n{mode_name}:")
        correct_count = 0
        total_count = len(TEST_ITEMS)
        
        for i, item in enumerate(TEST_ITEMS):
            expected = expected_categories.get(item['title'], '未分类')
            actual = data['results'][i]
            
            if expected == actual:
                correct_count += 1
            else:
                print(f"  ❌ {item['title']}: 期望={expected}, 实际={actual}")
        
        accuracy = correct_count / total_count * 100
        print(f"  准确率: {accuracy:.1f}% ({correct_count}/{total_count})")

def print_performance_summary(results_dict):
    """打印性能总结"""
    print("\n📈 性能总结")
    print("=" * 60)
    print(f"{'模式':<15} {'总耗时':<10} {'平均耗时':<12} {'速度排名':<10}")
    print("-" * 60)
    
    # 按速度排序
    sorted_results = sorted(results_dict.items(), key=lambda x: x[1]['time'])
    
    for i, (mode_name, data) in enumerate(sorted_results):
        speed_rank = f"第{i+1}名"
        print(f"{mode_name:<15} {data['time']:<10.3f} {data['avg_time']:<12.3f} {speed_rank:<10}")
    
    print("\n💡 推荐使用:")
    print("  - 极速采集: ULTRA_FAST_MODE")
    print("  - 日常使用: FAST_MODE")
    print("  - 平衡模式: BALANCED_MODE")
    print("  - 高精度: ACCURATE_MODE")

def main():
    """主测试函数"""
    print("🧪 分类优化效果测试")
    print("=" * 50)
    
    # 1. 测试单个分类
    traditional_results, optimized_results = test_single_classification()
    
    # 2. 测试批量分类
    batch_results = test_batch_classification()
    
    # 3. 测试不同模式
    mode_results = test_different_modes()
    
    # 4. 分析准确性
    analyze_accuracy(mode_results)
    
    # 5. 性能总结
    print_performance_summary(mode_results)
    
    print("\n✅ 测试完成！")
    print("\n💡 使用建议:")
    print("  1. 首次运行建议使用 FAST_MODE 或 ULTRA_FAST_MODE")
    print("  2. 后续运行可以利用缓存，使用 BALANCED_MODE")
    print("  3. 重要数据分析使用 ACCURATE_MODE")
    print("  4. 可以根据实际需求调整配置参数")

if __name__ == "__main__":
    main() 