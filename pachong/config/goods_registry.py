# 商品名集中管理
"""
所有需要爬取的商品集中管理
修改此文件后无需重启服务，实时生效
"""
GOODS_DEFINITIONS = {
    "digital": ["手机", "笔记本电脑", "平板电脑","台式电脑","耳机","蓝牙耳机","显卡","固态硬盘",""],
    "home_appliances": ["冰箱", "空调", "洗衣机"],

    # 可扩展其他分类
}

def get_goods_names(category=None):
    # """获取商品名称列表
    # Args:
    #     category: 指定分类（如'digital'），None返回全部
    # """
    if category:
        return GOODS_DEFINITIONS.get(category, [])
    return [name for names in GOODS_DEFINITIONS.values() for name in names]