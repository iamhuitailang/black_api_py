#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import urllib.request
import json

BASE_URL = "http://localhost:8001"
API_BASE = f"{BASE_URL}/api"

token = None
user_id = None

def make_request(url, method='GET', data=None, headers=None):
    default_headers = {'Content-Type': 'application/json'}
    if headers:
        default_headers.update(headers)
    
    req_data = None
    if data:
        req_data = json.dumps(data).encode('utf-8')
    
    req = urllib.request.Request(
        url, 
        data=req_data,
        headers=default_headers,
        method=method
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            return {
                'status': response.status,
                'data': json.loads(response.read().decode('utf-8'))
            }
    except urllib.error.HTTPError as e:
        return {
            'status': e.code,
            'data': json.loads(e.read().decode('utf-8')) if e.read() else None
        }
    except Exception as e:
        return {
            'status': 0,
            'error': str(e)
        }

def test_health():
    print("\n=== 测试健康检查 ===")
    result = make_request(f"{BASE_URL}/health")
    print(f"状态码: {result.get('status')}")
    print(f"响应: {result.get('data')}")
    return result.get('status') == 200

def test_register():
    global token, user_id
    print("\n=== 测试注册 ===")
    
    phone = "13800001111"
    data = {
        "phone": phone,
        "password": "123456",
        "nickname": "测试骑友"
    }
    
    result = make_request(f"{API_BASE}/qx/user/register", method='POST', data=data)
    print(f"状态码: {result.get('status')}")
    print(f"响应: {result.get('data')}")
    
    response_data = result.get('data', {})
    if response_data.get('code') == 0:
        print("✅ 注册成功")
        token = response_data.get('data', {}).get('token')
        user = response_data.get('data', {}).get('user')
        if user:
            user_id = user.get('id')
        print(f"Token: {token}")
        print(f"User ID: {user_id}")
        return True
    elif response_data.get('msg') == '该手机号已注册':
        print("用户已存在，尝试登录...")
        return test_login()
    else:
        print("❌ 注册失败")
        return False

def test_login():
    global token, user_id
    print("\n=== 测试登录 ===")
    
    phone = "13800001111"
    data = {
        "phone": phone,
        "password": "123456"
    }
    
    result = make_request(f"{API_BASE}/qx/user/login", method='POST', data=data)
    print(f"状态码: {result.get('status')}")
    print(f"响应: {result.get('data')}")
    
    response_data = result.get('data', {})
    if response_data.get('code') == 0:
        print("✅ 登录成功")
        token = response_data.get('data', {}).get('token')
        user = response_data.get('data', {}).get('user')
        if user:
            user_id = user.get('id')
        print(f"Token: {token}")
        print(f"User ID: {user_id}")
        return True
    else:
        print("❌ 登录失败")
        return False

def test_get_current_user():
    print("\n=== 测试获取当前用户 ===")
    
    if not token:
        print("❌ 未登录")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    result = make_request(f"{API_BASE}/qx/user/current/get", headers=headers)
    print(f"状态码: {result.get('status')}")
    print(f"响应: {result.get('data')}")
    
    response_data = result.get('data', {})
    if response_data.get('code') == 0:
        print("✅ 获取用户信息成功")
        return True
    else:
        print("❌ 获取用户信息失败")
        return False

def test_create_activity():
    print("\n=== 测试创建活动 ===")
    
    if not token:
        print("❌ 未登录")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "title": "周末休闲骑",
        "route": "翠湖环线",
        "distance": 25.5,
        "elevation": 100,
        "pace": "20-25km/h",
        "difficulty": "初级",
        "meeting_time": "2026-05-10 08:00:00",
        "meeting_point": "翠湖公园南门",
        "max_people": 20,
        "cost": 0,
        "description": "周末休闲骑，不追求速度，享受骑行的乐趣！"
    }
    
    print(f"请求数据: {data}")
    result = make_request(f"{API_BASE}/qx/activity/create", method='POST', data=data, headers=headers)
    print(f"状态码: {result.get('status')}")
    print(f"响应: {result.get('data')}")
    
    response_data = result.get('data', {})
    if response_data.get('code') == 0:
        print("✅ 创建活动成功")
        return response_data.get('data', {}).get('id')
    else:
        print("❌ 创建活动失败")
        return False

def test_get_activity_list():
    print("\n=== 测试获取活动列表 ===")
    
    result = make_request(f"{API_BASE}/qx/activity/list/get")
    print(f"状态码: {result.get('status')}")
    print(f"响应: {result.get('data')}")
    
    response_data = result.get('data', {})
    if response_data.get('code') == 0:
        print("✅ 获取活动列表成功")
        return True
    else:
        print("❌ 获取活动列表失败")
        return False

def test_create_ride():
    print("\n=== 测试创建骑行记录 ===")
    
    if not token:
        print("❌ 未登录")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "distance": 30.5,
        "duration": 90,
        "avg_speed": 20.3,
        "max_speed": 35.2,
        "elevation": 150,
        "route_name": "周末晨骑",
        "date": "2026-05-05",
        "notes": "今天状态不错，一路顺风！"
    }
    
    print(f"请求数据: {data}")
    result = make_request(f"{API_BASE}/qx/ride/create", method='POST', data=data, headers=headers)
    print(f"状态码: {result.get('status')}")
    print(f"响应: {result.get('data')}")
    
    response_data = result.get('data', {})
    if response_data.get('code') == 0:
        print("✅ 创建骑行记录成功")
        return True
    else:
        print("❌ 创建骑行记录失败")
        return False

def test_create_post():
    print("\n=== 测试创建动态 ===")
    
    if not token:
        print("❌ 未登录")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "content": "今天的骑行太爽了！翠湖的风景真美，下次还要来。",
        "activity_id": 0
    }
    
    print(f"请求数据: {data}")
    result = make_request(f"{API_BASE}/qx/post/create", method='POST', data=data, headers=headers)
    print(f"状态码: {result.get('status')}")
    print(f"响应: {result.get('data')}")
    
    response_data = result.get('data', {})
    if response_data.get('code') == 0:
        print("✅ 创建动态成功")
        return True
    else:
        print("❌ 创建动态失败")
        return False

def main():
    print("=" * 50)
    print("骑行搭子 API 测试脚本")
    print("=" * 50)
    
    # 健康检查
    if not test_health():
        print("\n❌ 服务器未启动，请先启动服务器: python main.py")
        return
    
    # 注册/登录
    test_register()
    
    if not token:
        print("\n❌ 登录失败，无法继续测试")
        return
    
    # 获取当前用户
    test_get_current_user()
    
    # 创建活动
    activity_id = test_create_activity()
    
    # 获取活动列表
    test_get_activity_list()
    
    # 创建骑行记录
    test_create_ride()
    
    # 创建动态
    test_create_post()
    
    print("\n" + "=" * 50)
    print("测试完成")
    print("=" * 50)

if __name__ == "__main__":
    main()
