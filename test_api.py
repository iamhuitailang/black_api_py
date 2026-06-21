#!/usr/bin/env python3
"""深度测试冰川游戏API"""
import sys
sys.path.insert(0, '.')

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("=" * 60)
print("深度测试冰川游戏API")
print("=" * 60)

# 1. 创建游戏
print("\n1. 创建新游戏...")
r = client.post('/api/glacier/new/game')
print(f"   状态码: {r.status_code}")
data = r.json()
print(f"   code: {data['code']}")
if data['code'] != 0:
    print(f"   错误: {data['message']}")
    sys.exit(1)
gid = data['data']['game_id']
print(f"   game_id: {gid}")
print(f"   初始回合: {data['data']['turn_count']}")
print(f"   初始进度: {data['data']['current_layer_info']['dug_progress']}")

# 2. 测试 POST body 参数
print("\n2. 测试 POST body 传参 (正确方式)...")
r = client.post('/api/glacier/dig', json={'game_id': gid})
print(f"   状态码: {r.status_code}")
data = r.json()
print(f"   code: {data['code']}")
if data['code'] == 0:
    d = data['data']
    print(f"   回合: {d['turn_count']}")
    prog = d['current_layer_info']['dug_progress']
    thick = d['current_layer_info']['thickness']
    print(f"   进度: {prog:.1f} / {thick:.1f} = {prog/thick*100:.1f}%")
    print(f"   体能: {d['stamina']:.1f}")
    print(f"   事件: {d.get('turn_events', [])}")
    print(f"   ✅ POST body 参数成功！")
else:
    print(f"   ❌ 失败: {data.get('message')}")
    print(f"   完整响应: {r.text}")

# 3. 测试 Query 参数方式
print("\n3. 测试 Query 传参 (旧方式)...")
r = client.post(f'/api/glacier/dig?game_id={gid}')
print(f"   状态码: {r.status_code}")
data = r.json()
print(f"   code: {data['code']}")
print(f"   message: {data.get('message')}")

# 4. 测试状态恢复（模拟刷新）
print("\n4. 测试状态恢复 (模拟页面刷新)...")
r = client.get(f'/api/glacier/state/get', params={'game_id': gid})
data = r.json()
print(f"   code: {data['code']}")
if data['code'] == 0:
    d = data['data']
    print(f"   game_id: {d['game_id']}")
    print(f"   回合: {d['turn_count']}")
    prog = d['current_layer_info']['dug_progress']
    print(f"   进度: {prog:.1f}")
    if d['turn_count'] == 1 and prog > 0:
        print(f"   ✅ 状态恢复成功！")
    else:
        print(f"   ❌ 状态不一致！")

# 5. 测试 /latest/get
print("\n5. 测试获取最新游戏...")
r = client.get('/api/glacier/latest/get')
data = r.json()
print(f"   code: {data['code']}")
if data['code'] == 0:
    print(f"   latest game_id: {data['data']['game_id']}")
    if data['data']['game_id'] == gid:
        print(f"   ✅ latest/get 返回正确")

print("\n" + "=" * 60)
print("测试完成")
print("=" * 60)
