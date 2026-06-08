import requests

BASE = "http://localhost:8003/api/dafeiji"

r = requests.post(f"{BASE}/auth/login", json={"username": "testuser2024", "password": "test123456"})
token = r.json()['data']['token']
print("✓ 登录成功")

r = requests.get(f"{BASE}/auth/user/info", headers={"Authorization": f"Bearer {token}"})
d = r.json()
print(f"✓ 用户信息: {d['data']['username']} ({d['data']['role']})")

r = requests.get(f"{BASE}/game/planes")
print(f"✓ 飞机列表: {len(r.json()['data'])} 架")

r = requests.get(f"{BASE}/game/waves")
print(f"✓ 波次列表: {len(r.json()['data'])} 波")

r = requests.get(f"{BASE}/game/achievements")
print(f"✓ 成就列表: {len(r.json()['data'])} 个")

r = requests.get(f"{BASE}/game/leaderboard?type=daily")
print(f"✓ 排行榜: {len(r.json()['data'])} 条")

r = requests.post(f"{BASE}/game/state/save", 
    headers={"Authorization": f"Bearer {token}"},
    json={"plane_id": "vanguard", "state_data": {"x": 400}, "score": 1000, "wave": 3, "is_paused": False})
d = r.json()
print(f"✓ 保存状态: state_id={d['data']['id']}")

r = requests.get(f"{BASE}/game/state/load", headers={"Authorization": f"Bearer {token}"})
d = r.json()
print(f"✓ 加载状态: score={d['data']['score'] if d['data'] else 'none'}")

r = requests.post(f"{BASE}/auth/login", json={"username": "admin", "password": "admin123"})
admin_token = r.json()['data']['token']
print("✓ 管理员登录成功")

r = requests.get(f"{BASE}/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
d = r.json()
print(f"✓ 管理员-用户列表: {len(d['data']['list'])} 个用户")

r = requests.get(f"{BASE}/admin/statistics", headers={"Authorization": f"Bearer {admin_token}"})
print(f"✓ 管理员-数据统计: code={r.json()['code']}")

print()
print("=== 所有API测试通过 ===")
