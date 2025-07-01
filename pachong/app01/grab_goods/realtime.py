# producer_consumer.py
import redis
from rq import Queue
from sn_goods import crawler

# 任务队列
redis_conn = redis.Redis()
task_queue = Queue('crawler_tasks', connection=redis_conn)

# 提交任务
task_queue.enqueue(crawler().crawl, keyword="手机")
# task_queue.enqueue(JDSpider().crawl, keyword="电脑")

# 启动worker (单独进程)
# rq worker crawler_tasks