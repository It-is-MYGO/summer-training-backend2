# consumers.py
# WebSocket处理
class ProductConsumer(AsyncWebsocketConsumer):
    groups = ["price_updates"]

    async def send_realtime_data(self, event):
        """发送实时数据"""
        await self.send(text_data=json.dumps({
            "type": "price_update",
            "data": event["data"]
        }))

    async def send_db_data(self, event):
        """发送数据库聚合数据"""
        await self.send(text_data=json.dumps({
            "type": "trend",
            "data": event["data"]
        }))