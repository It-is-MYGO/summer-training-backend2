#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试智谱AI连接
"""

import requests
import json
import hashlib
import base64
import hmac
from datetime import datetime
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 智谱AI配置
ZHIPU_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
ZHIPU_API_KEY = "da8d5f3ab93340978cc36de720635a95.1MzyRLcNXkvVOGpD"

def generate_signature_v1(api_key, timestamp):
    """生成智谱AI签名 - 方法1"""
    try:
        # 解析API Key
        id, secret = api_key.split('.')
        
        # 生成签名
        signature_origin = f"host: open.bigmodel.cn\ndate: {timestamp}\nPOST /api/paas/v4/chat/completions HTTP/1.1"
        signature_sha = hmac.new(
            secret.encode('utf-8'),
            signature_origin.encode('utf-8'),
            digestmod=hashlib.sha256
        ).digest()
        
        signature = base64.b64encode(signature_sha).decode('utf-8')
        authorization_origin = f'api_key="{id}", algorithm="hmac-sha256", headers="host date request-line", signature="{signature}"'
        authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode('utf-8')
        
        return f"Bearer {authorization}"
    except Exception as e:
        logger.error(f"生成签名失败: {e}")
        return None

def generate_signature_v2(api_key, timestamp):
    """生成智谱AI签名 - 方法2（直接使用API Key）"""
    try:
        return f"Bearer {api_key}"
    except Exception as e:
        logger.error(f"生成签名失败: {e}")
        return None

def generate_signature_v3(api_key, timestamp):
    """生成智谱AI签名 - 方法3（简化版）"""
    try:
        # 解析API Key
        id, secret = api_key.split('.')
        
        # 生成签名
        signature_origin = f"host: open.bigmodel.cn\ndate: {timestamp}\nPOST /api/paas/v4/chat/completions HTTP/1.1"
        signature_sha = hmac.new(
            secret.encode('utf-8'),
            signature_origin.encode('utf-8'),
            digestmod=hashlib.sha256
        ).digest()
        
        signature = base64.b64encode(signature_sha).decode('utf-8')
        authorization_origin = f'api_key="{id}", algorithm="hmac-sha256", headers="host date request-line", signature="{signature}"'
        authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode('utf-8')
        
        return authorization  # 不添加Bearer前缀
    except Exception as e:
        logger.error(f"生成签名失败: {e}")
        return None

def test_zhipu_connection(signature_method, method_name):
    """测试智谱AI连接"""
    print(f"\n🔧 测试方法: {method_name}")
    print("=" * 50)
    
    try:
        # 构建请求数据
        timestamp = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')
        authorization = signature_method(ZHIPU_API_KEY, timestamp)
        
        if not authorization:
            print("❌ 签名生成失败")
            return False
        
        print(f"时间戳: {timestamp}")
        print(f"授权头: {authorization[:50]}...")
        
        # 请求数据
        data = {
            "model": "glm-4",
            "messages": [
                {
                    "role": "user",
                    "content": "你好，请简单回复'测试成功'"
                }
            ],
            "temperature": 0.1,
            "max_tokens": 100
        }
        
        headers = {
            "Authorization": authorization,
            "Content-Type": "application/json",
            "Date": timestamp
        }
        
        print("📤 发送请求...")
        
        # 发送请求
        response = requests.post(
            ZHIPU_URL,
            headers=headers,
            json=data,
            timeout=30
        )
        
        print(f"📥 响应状态码: {response.status_code}")
        print(f"📥 响应头: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 请求成功!")
            print(f"📄 响应内容: {result}")
            return True
        else:
            print(f"❌ 请求失败: {response.status_code}")
            print(f"📄 错误响应: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ 异常: {e}")
        return False

def main():
    """主函数"""
    print("🎯 智谱AI连接测试")
    print("=" * 60)
    
    # 测试不同的签名方法
    methods = [
        (generate_signature_v1, "标准签名方法"),
        (generate_signature_v2, "直接API Key方法"),
        (generate_signature_v3, "简化签名方法")
    ]
    
    success_count = 0
    for method, name in methods:
        if test_zhipu_connection(method, name):
            success_count += 1
            print(f"✅ {name} 测试成功!")
        else:
            print(f"❌ {name} 测试失败!")
        
        print("-" * 50)
    
    print(f"\n📊 测试结果: {success_count}/{len(methods)} 个方法成功")
    
    if success_count == 0:
        print("\n💡 建议:")
        print("1. 检查API Key是否正确")
        print("2. 确认API Key是否有效")
        print("3. 检查网络连接")
        print("4. 查看智谱AI官方文档")
    else:
        print("\n🎉 找到可用的连接方法!")

if __name__ == "__main__":
    main() 