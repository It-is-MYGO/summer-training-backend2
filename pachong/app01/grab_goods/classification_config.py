# -*- coding: utf-8 -*-
"""
商品分类优化配置文件
提供多种分类策略来平衡速度和准确性
"""

# 快速模式配置 - 优先速度
FAST_MODE = {
    'use_cache': True,           # 启用缓存
    'use_batch_ai': False,       # 禁用批量AI（避免网络延迟）
    'use_traditional_first': True,  # 优先使用传统方法
    'ai_confidence_threshold': 0.8,  # 提高AI置信度阈值
    'max_concurrent_requests': 3,    # 减少并发数
    'cache_expire_days': 30      # 延长缓存时间
}

# 平衡模式配置 - 平衡速度和准确性
BALANCED_MODE = {
    'use_cache': True,           # 启用缓存
    'use_batch_ai': True,        # 启用批量AI
    'use_traditional_first': True,  # 优先使用传统方法
    'ai_confidence_threshold': 0.7,  # 标准AI置信度阈值
    'max_concurrent_requests': 5,    # 标准并发数
    'cache_expire_days': 7       # 标准缓存时间
}

# 高精度模式配置 - 优先准确性
ACCURATE_MODE = {
    'use_cache': True,           # 启用缓存
    'use_batch_ai': True,        # 启用批量AI
    'use_traditional_first': False,  # 优先使用AI方法
    'ai_confidence_threshold': 0.6,  # 降低AI置信度阈值
    'max_concurrent_requests': 8,    # 增加并发数
    'cache_expire_days': 3       # 缩短缓存时间
}

# 极速模式配置 - 最快速度
ULTRA_FAST_MODE = {
    'use_cache': True,           # 启用缓存
    'use_batch_ai': False,       # 禁用批量AI
    'use_traditional_first': True,  # 优先使用传统方法
    'ai_confidence_threshold': 0.9,  # 极高AI置信度阈值
    'max_concurrent_requests': 1,    # 最小并发数
    'cache_expire_days': 60      # 最长缓存时间
}

# 当前使用的模式（可以修改这里来切换模式）
CURRENT_MODE = 'BALANCED_MODE'

# 模式映射
MODE_MAP = {
    'FAST_MODE': FAST_MODE,
    'BALANCED_MODE': BALANCED_MODE,
    'ACCURATE_MODE': ACCURATE_MODE,
    'ULTRA_FAST_MODE': ULTRA_FAST_MODE
}

def get_classification_strategy():
    """获取当前分类策略配置"""
    return MODE_MAP.get(CURRENT_MODE, BALANCED_MODE)

def set_mode(mode_name):
    """设置分类模式"""
    global CURRENT_MODE
    if mode_name in MODE_MAP:
        CURRENT_MODE = mode_name
        print(f"✅ 已切换到 {mode_name} 模式")
        return True
    else:
        print(f"❌ 未知模式: {mode_name}")
        print(f"可用模式: {', '.join(MODE_MAP.keys())}")
        return False

def print_mode_info():
    """打印当前模式信息"""
    strategy = get_classification_strategy()
    print(f"\n📊 当前分类模式: {CURRENT_MODE}")
    print(f"  - 缓存启用: {strategy['use_cache']}")
    print(f"  - 批量AI分类: {strategy['use_batch_ai']}")
    print(f"  - 传统方法优先: {strategy['use_traditional_first']}")
    print(f"  - AI置信度阈值: {strategy['ai_confidence_threshold']}")
    print(f"  - 最大并发数: {strategy['max_concurrent_requests']}")
    print(f"  - 缓存过期天数: {strategy['cache_expire_days']}")
    
    # 性能预估
    if strategy['use_traditional_first']:
        speed_estimate = "快"
    else:
        speed_estimate = "中等"
    
    if strategy['ai_confidence_threshold'] <= 0.7:
        accuracy_estimate = "高"
    else:
        accuracy_estimate = "中等"
    
    print(f"  - 预估速度: {speed_estimate}")
    print(f"  - 预估准确性: {accuracy_estimate}")

if __name__ == "__main__":
    print("🔧 分类配置工具")
    print("=" * 50)
    
    print_mode_info()
    
    print("\n💡 使用示例:")
    print("  from classification_config import set_mode, get_classification_strategy")
    print("  set_mode('FAST_MODE')  # 切换到快速模式")
    print("  strategy = get_classification_strategy()  # 获取配置")
    
    print("\n📋 模式说明:")
    print("  FAST_MODE: 快速模式 - 优先速度，适合大量数据采集")
    print("  BALANCED_MODE: 平衡模式 - 平衡速度和准确性（推荐）")
    print("  ACCURATE_MODE: 高精度模式 - 优先准确性，适合重要数据")
    print("  ULTRA_FAST_MODE: 极速模式 - 最快速度，仅使用传统方法") 