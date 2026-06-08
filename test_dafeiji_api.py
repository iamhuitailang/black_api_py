#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:8003/api/dafeiji"

def test_register():
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "username": "testuser2024",
        "password": "test123456",
        "confirm_password": "test123456"
    })
    print(f"注册: {r.status_code} - {r.json()['message']}")

def test_login():
    r = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "testuser2024",
        "password": "test123456"
    })
    data = r.json()
    print(f"登录: {r.status_code} - code={data['code']} msg={data['message']}")
    if data['code'] == 0:
        return data['data']['token']
    return None

def test_user_info(token):
    r = requests.get(f"{BASE_URL}/auth/user-info", headers={"Authorization": f"Bearer {token}"})
    data = r.json()
    print(f"用户信息: username={data['data']['username']} role={data['data']['role']}")

def test_planes():
    r = requests.get(f"{BASE_URL}/game/planes")
    data = r.json()
    print(f"飞机列表: {len(data['data'])} 架")
    for p in data['data'][:2]:
        print(f"  - {p['name']} ({p['plane_id']})")

def test_waves():
    r = requests.get(f"{BASE_URL}/game/waves")
    data = r.json()
    print(f"波次列表: {len(data['data'])} 波")

def test_state_save(token):
    r = requests.post(f"{BASE_URL}/game/state-save", 
        headers={"Authorization": f"Bearer {token}"},
        json={
            "plane_id": "vanguard",
            "state_data": {"playerX": 400, "playerY": 500, "weaponLevel": 2, "shields": ["shield1"]},
            "score": 2500,
            "wave": 5,
            "is_paused": False
        })
    data = r.json()
    print(f"保存状态: code={data['code']} state_id={data['data']['id'] if data['data'] else 'N/A'}")
    return data['data']['id'] if data['data'] else None

def test_state_load(token):
    r = requests.get(f"{BASE_URL}/game/state-load", headers={"Authorization": f"Bearer {token}"})
    data = r.json()
    if data['data']:
        print(f"加载状态: score={data['data']['score']} wave={data['data']['wave']}")
    else:
        print(f"加载状态: 无存档")

def test_achievements(token):
    r = requests.get(f"{BASE_URL}/game/achievements", headers={"Authorization": f"Bearer {token}"})
    data = r.json()
    print(f"成就列表: {len(data['data'])} 个")

def test_leaderboard():
    r = requests.get(f"{BASE_URL}/game/leaderboard?type=daily")
    data = r.json()
    print(f"排行榜: {len(data['data'])} 条记录")

def test_admin():
    r = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    token = r.json()['data']['token']
    
    r = requests.get(f"{BASE_URL}/admin/users", headers={"Authorization": f"Bearer {token}"})
    data = r.json()
    print(f"管理员-用户列表: code={data['code']} count={len(data['data'].get('list', []))}")
    
    r = requests.get(f"{BASE_URL}/admin/statistics", headers={"Authorization": f"Bearer {token}"})
    data = r.json()
    print(f"管理员-数据统计: code={data['code']}")

if __name__ == "__main__":
    print("=" * 50)
    print("打飞机游戏 API 测试")
    print("=" * 50)
    
    test_register()
    token = test_login()
    if token:
        test_user_info(token)
        test_planes()
        test_waves()
        test_state_save(token)
        test_state_load(token)
        test_achievements(token)
        test_leaderboard()
        test_admin()
    
    print("=" * 50)
    print("测试完成")
