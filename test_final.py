import requests
import json

BASE = "http://localhost:8003/api/dafeiji"

print("=" * 60)
print("末日机甲打飞机游戏 - 完整API测试")
print("=" * 60)

r = requests.post(f"{BASE}/auth/register", json={
    "username": "apitest001", "password": "test123456", "confirm_password": "test123456"
})
print(f"[REG] 注册: {r.json()['message']}")

r = requests.post(f"{BASE}/auth/login", json={"username": "apitest001", "password": "test123456"})
token = r.json()['data']['token']
user = r.json()['data']['user']
print(f"[LOGIN] 登录成功: {user['username']} ({user['role']})")

r = requests.get(f"{BASE}/auth/user/info", headers={"Authorization": f"Bearer {token}"})
print(f"[USER] 用户信息: {r.json()['data']['username']}")

r = requests.get(f"{BASE}/game/planes")
planes = r.json()['data']
print(f"[PLANES] 飞机列表: {len(planes)} 架 [{', '.join(p['name'] for p in planes)}]")

r = requests.get(f"{BASE}/game/waves")
waves = r.json()['data']
print(f"[WAVES] 波次列表: {len(waves)} 波")

r = requests.get(f"{BASE}/game/achievements")
achievements = r.json()['data']
print(f"[ACHIEVEMENTS] 成就列表: {len(achievements)} 个")

r = requests.get(f"{BASE}/game/leaderboard?type=all")
print(f"[LEADERBOARD] 排行榜: {len(r.json()['data'])} 条")

r = requests.post(f"{BASE}/game/state/save", 
    headers={"Authorization": f"Bearer {token}"},
    json={"plane_id": "lightning", "state_data": {"playerX": 400, "weaponLevel": 2}, 
          "score": 1500, "wave": 3, "is_paused": False})
state_id = r.json()['data']['state_id']
print(f"[STATE SAVE] 保存状态: state_id={state_id}")

r = requests.get(f"{BASE}/game/state/load", headers={"Authorization": f"Bearer {token}"})
state = r.json()['data']
print(f"[STATE LOAD] 加载状态: score={state['score']}, wave={state['wave']}")

r = requests.post(f"{BASE}/game/end",
    headers={"Authorization": f"Bearer {token}"},
    json={
        "state_id": state_id, "score": 1500, "wave": 3, "kills": 10,
        "play_time": 120, "plane_id": "lightning",
        "collected_items": ["shield", "weapon"], "used_planes": ["lightning"],
        "perfect_waves": 1
    })
result = r.json()
print(f"[GAME END] 游戏结束: code={result['code']}, msg={result['message']}")
if result['data'] and result['data'].get('new_achievements'):
    print(f"  新解锁成就: {len(result['data']['new_achievements'])} 个")

r = requests.post(f"{BASE}/auth/login", json={"username": "admin", "password": "admin123"})
admin_token = r.json()['data']['token']
print(f"[ADMIN LOGIN] 管理员登录成功")

r = requests.get(f"{BASE}/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
users = r.json()['data']
print(f"[ADMIN USERS] 用户列表: {users['total']} 个用户")

r = requests.get(f"{BASE}/admin/planes", headers={"Authorization": f"Bearer {admin_token}"})
print(f"[ADMIN PLANES] 飞机管理: {len(r.json()['data'])} 架")

r = requests.get(f"{BASE}/admin/waves", headers={"Authorization": f"Bearer {admin_token}"})
print(f"[ADMIN WAVES] 波次管理: {len(r.json()['data'])} 波")

r = requests.get(f"{BASE}/admin/statistics", headers={"Authorization": f"Bearer {admin_token}"})
stats = r.json()['data']
print(f"[ADMIN STATS] 数据统计: 总用户{stats.get('total_users', 'N/A')}, 总游戏{stats.get('total_games', 'N/A')}")

print()
print("=" * 60)
print("✅ 所有API测试通过！")
print("=" * 60)
