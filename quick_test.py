import requests, json

BASE = 'http://localhost:8890'

r = requests.post(f'{BASE}/api/auth/login', json={'username':'testuser2','password':'123456'})
token = r.json()['data']['token']
h = {'Authorization': f'Bearer {token}'}

print('=== 连续5次开局测试 ===')
for i in range(5):
    r = requests.post(f'{BASE}/api/wordchain/game/start', headers=h)
    d = r.json()
    if d['code'] == 0:
        print(f'  第{i+1}局: {d["data"]["start_word"]}')
        requests.post(f'{BASE}/api/wordchain/game/timeout', headers=h, json={'game_id': d['data']['game_id']})
    else:
        print(f'  第{i+1}局: 失败 - {d["message"]}')

print('\n=== 恢复接口测试 ===')
r = requests.post(f'{BASE}/api/wordchain/game/start', headers=h)
d = r.json()
print(f'开始游戏: {d["data"]["start_word"]}, game_id={d["data"]["game_id"]}')

r = requests.get(f'{BASE}/api/wordchain/game/resume/get', headers=h)
d = r.json()
print(f'恢复: code={d["code"]}, has_unfinished={d["data"].get("has_unfinished")}')
if d['data'].get('has_unfinished'):
    g = d['data']['game']
    print(f'  game_id={g["id"]}, last_char={g["current_last_char"]}, rounds={g["round_count"]}')
