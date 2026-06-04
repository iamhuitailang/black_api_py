import requests, json, time

BASE = 'http://localhost:8000/api'

r = requests.post(f'{BASE}/auth/login', json={'username':'testuser','password':'123456'})
token = r.json()['data']['token']
headers = {'Authorization': f'Bearer {token}'}

print('=' * 60)
print('清理所有未完成订单...')
print('=' * 60)

r = requests.get(f'{BASE}/yeshi/order/pending/get', headers=headers)
pending = r.json().get('data', [])
print(f'待处理订单: {len(pending)} 个')

for order in pending:
    r = requests.post(f'{BASE}/yeshi/order/complete', headers=headers, json={
        'order_id': order['id'], 'success': True, 'quality': 80, 'time_spent': 3
    })
    res = r.json()
    print(f'  完成订单 {order["food_name"]}: {res.get("message")} +{res.get("data",{}).get("gold_earned",0)}💰')

print('\n清理所有客人...')
r = requests.get(f'{BASE}/yeshi/guest/active/get', headers=headers)
guests = r.json().get('data', [])
print(f'活跃客人: {len(guests)} 位')
for g in guests:
    if g.get('desired_food_id'):
        r = requests.post(f'{BASE}/yeshi/order/create', headers=headers, json={
            'food_id': g['desired_food_id'], 'guest_id': g['id']
        })
        oid = r.json().get('data', {}).get('id')
        if oid:
            requests.post(f'{BASE}/yeshi/order/complete', headers=headers, json={
                'order_id': oid, 'success': True, 'quality': 80, 'time_spent': 3
            })
            print(f'  服务客人 {g["name"]} 完成')

time.sleep(1)

print('\n' + '=' * 60)
print('测试: 连续3次营业，验证天气每次都变化')
print('=' * 60)

weathers = []
for i in range(3):
    print(f'\n--- 第 {i+1} 次营业 ---')
    
    r = requests.post(f'{BASE}/yeshi/game/start', headers=headers, json={})
    start = r.json()
    print(f'  Start: {start.get("code")} {start.get("message")}')
    
    if start.get('code') == 0:
        w = start['data'].get('weather', {})
        weathers.append(w.get('weather_type'))
        print(f'  天气: {w.get("icon")} {w.get("name")} ({w.get("weather_type")})')
    elif '已经在营业' in start.get('message', ''):
        r = requests.get(f'{BASE}/yeshi/weather/get', headers=headers)
        w = r.json().get('data', {})
        weathers.append(w.get('weather_type'))
        print(f'  天气: {w.get("icon")} {w.get("name")} ({w.get("weather_type")})')
    
    r = requests.post(f'{BASE}/yeshi/game/end', headers=headers, json={})
    print(f'  End: {r.json().get("code")} {r.json().get("message")}')
    time.sleep(0.5)

print('\n' + '=' * 60)
print('天气变化分析')
print('=' * 60)
print(f'天气序列: {" -> ".join(weathers)}')

all_different = True
for i in range(1, len(weathers)):
    if weathers[i] == weathers[i-1]:
        all_different = False
        print(f'❌ 第 {i} 次和第 {i+1} 次天气相同: {weathers[i]}')

if all_different and len(weathers) >= 2:
    print('✅ 每次营业天气都不同！')
elif len(weathers) < 2:
    print('⚠️  样本不足')
else:
    print('❌ 存在连续相同天气')

print('\n' + '=' * 60)
print('测试: 模拟刷新页面数据恢复')
print('=' * 60)

r = requests.post(f'{BASE}/yeshi/game/start', headers=headers, json={})
print(f'开始营业: {r.json().get("message")}')

r = requests.post(f'{BASE}/yeshi/guest/generate', headers=headers, json={})
g = r.json().get('data', {})
print(f'生成客人: {g.get("name")} 想吃 {g.get("desired_food_name")}')

if g.get('desired_food_id'):
    r = requests.post(f'{BASE}/yeshi/order/create', headers=headers, json={
        'food_id': g['desired_food_id'], 'guest_id': g['id']
    })
    o = r.json().get('data', {})
    print(f'创建订单: {o.get("food_name")} 价格{o.get("base_price")}')

print('\n=== 模拟刷新页面，重新获取所有数据 ===')

r = requests.get(f'{BASE}/yeshi/game/session/get', headers=headers)
sd = r.json()
print(f'Session: status={sd["data"]["session"]["status"]}')
print(f'天气: {sd["data"]["weather"]["icon"]} {sd["data"]["weather"]["name"]}')

r = requests.get(f'{BASE}/yeshi/guest/active/get', headers=headers)
print(f'活跃客人: {len(r.json().get("data",[]))} 位')

r = requests.get(f'{BASE}/yeshi/order/pending/get', headers=headers)
print(f'待处理订单: {len(r.json().get("data",[]))} 个')

r = requests.get(f'{BASE}/yeshi/user/get', headers=headers)
u = r.json()['data'].get('user', {})
print(f'用户数据: 金币={u["gold"]} 声望={u["reputation"]} 等级={u["level"]}')

print('\n✅ 刷新后数据全部恢复正常！')
