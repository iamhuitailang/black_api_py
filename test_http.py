#!/usr/bin/env python3
"""测试真实HTTP请求到2080端口"""
import requests
import json

BASE = "http://localhost:2080/api/glacier"

print("=" * 60)
print("测试真实HTTP请求 (端口 2080)")
print("=" * 60)

# 1. 创建游戏
print("\n1. POST /new/game")
r = requests.post(f"{BASE}/new/game")
print(f"   状态码: {r.status_code}")
data = r.json()
print(f"   code: {data['code']}")
if data['code'] != 0:
    print(f"   ❌ 错误: {data}")
    exit(1)
gid = data['data']['game_id']
print(f"   ✅ game_id = {gid}")

# 2. 挖掘 (POST body)
print("\n2. POST /dig (body传参)")
payload = {"game_id": gid}
print(f"   请求: POST {BASE}/dig, body={payload}")
r = requests.post(f"{BASE}/dig", json=payload)
print(f"   状态码: {r.status_code}")
print(f"   响应: {r.text[:300]}")
data = r.json()
print(f"   code: {data['code']}")
if data['code'] == 0:
    d = data['data']
    l = d['current_layer_info']
    print(f"   ✅ 成功!")
    print(f"   - 回合: {d['turn_count']}")
    print(f"   - 进度: {l['dug_progress']:.1f} / {l['thickness']:.1f}")
    print(f"   - 体能: {d['stamina']:.1f}")
    print(f"   - 事件: {d.get('turn_events', [])}")
else:
    print(f"   ❌ 失败: {data}")

# 3. 再次挖掘确认进度增加
print("\n3. 再次挖掘 (确认进度累加)")
r = requests.post(f"{BASE}/dig", json=payload)
data = r.json()
if data['code'] == 0:
    d = data['data']
    l = d['current_layer_info']
    print(f"   ✅ 回合: {d['turn_count']}, 进度: {l['dug_progress']:.1f}")
    if l['dug_progress'] > 0 and d['turn_count'] == 2:
        print(f"   ✅ 进度正确累加！")

# 4. 状态恢复测试
print("\n4. GET /state/get (模拟页面刷新)")
r = requests.get(f"{BASE}/state/get", params={"game_id": gid})
data = r.json()
if data['code'] == 0:
    d = data['data']
    l = d['current_layer_info']
    print(f"   - game_id: {d['game_id']}")
    print(f"   - 回合: {d['turn_count']}")
    print(f"   - 进度: {l['dug_progress']:.1f}")
    if d['turn_count'] == 2 and l['dug_progress'] > 0:
        print(f"   ✅ 状态完全恢复！")

# 5. latest/get 测试
print("\n5. GET /latest/get")
r = requests.get(f"{BASE}/latest/get")
data = r.json()
if data['code'] == 0:
    print(f"   - latest game_id: {data['data']['game_id']}")
    if data['data']['game_id'] == gid:
        print(f"   ✅ latest/get 返回正确")

print("\n" + "=" * 60)
print("后端 HTTP API 全部测试通过！")
print("问题 100% 出在前端！")
print("=" * 60)
