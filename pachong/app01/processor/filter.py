# processors/filter.py
 # 数据过滤存储
from django.db import transaction
import redis
class DataFilter:
    def __init__(self):
        self.redis = redis.Redis()
        self.price_thresholds = {}  # 商品价格波动阈值

    async def process(self):
        while True:
            # 从消息队列获取数据
            _, data = await self.redis.xread("crawl_stream", latest_id='$')
            
            # 关键数据存储逻辑
            if self._need_save(data):
                await self._save_to_mysql(data)
            
            # 全量数据缓存
            await self._cache_to_redis(data)

    def _need_save(self, data):
        """判断是否需要持久化"""
        last_price = self._get_last_price(data['product_id'])
        price_change = abs(data['price'] - last_price) / last_price
        return price_change > 0.01  # 价格波动>1%时存储

    @transaction.atomic
    def _save_to_mysql(self, data):
        # 更新核心数据
        product, _ = Product.objects.update_or_create(
            product_id=data['product_id'],
            defaults={
                'name': data['name'],
                'latest_price': data['price']
            }
        )
        # 记录历史价格
        PriceHistory.objects.create(
            product=product,
            price=data['price']
        )