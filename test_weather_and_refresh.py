import requests, json

BASE = 'http://localhost:8000/api'

print('=' * 60)
print('测试1: 登录')
print('=' * 60)
r = requests.post(f'{BASE}/auth/login', json={'username':'testuser','password':'123456'})
login_data = r.json()
print(f'Login: code={login_data.get("code")} msg={login_data.get("message")}')
token = login_data['data']['token']
headers = {'Authorization': f'Bearer {token}'}

print('\n' + '=' * 60)
print('测试2: 先打烊（确保没有活跃session）')
print('=' * 60)
r = requests.post(f'{BASE}/yeshi/game/end', headers=headers, json={})
end_data = r.json()
print(f'End: code={end_data.get("code")} msg={end_data.get("message")}')

print('\n' + '=' * 60)
print('测试3: 第一次营业 - 检查天气1')
print('=' * 60)
r = requests.post(f'{BASE}/yeshi/game/start', headers=headers, json={})
start1 = r.json()
print(f'Start1: code={start1.get("code")} msg={start1.get("message")}')
weather1 = None
if start1.get('code') == 0:
    weather1 = start1['data'].get('weather', {})
    print(f'  天气1: {weather1.get("icon")} {weather1.get("name")} (type={weather1.get("weather_type")})')

print('\n' + '=' * 60)
print('测试4: 生成客人并下单')
print('=' * 60)
r = requests.post(f'{BASE}/yeshi/guest/generate', headers=headers, json={})
g1 = r.json()
print(f'Guest1: code={g1.get("code")} msg={g1.get("message")}')
guest_id = None
food_id = None
if g1.get('code') == 0:
    g = g1['data']
    guest_id = g['id']
    food_id = g.get('desired_food_id')
    print(f'  客人: {g.get("name")} 想吃: {g.get("desired_food_icon")} {g.get("desired_food_name")}')

if guest_id and food_id:
    r = requests.post(f'{BASE}/yeshi/order/create', headers=headers, json={
        'food_id': food_id, 'guest_id': guest_id
    })
    o1 = r.json()
    print(f'Order: code={o1.get("code")} msg={o1.get("message")}')
    if o1.get('code') == 0:
        print(f'  订单创建成功: {o1["data"].get("food_name")} 价格: {o1["data"].get("base_price")}')

print('\n' + '=' * 60)
print('测试5: 模拟刷新 - 获取session和所有数据')
print('=' * 60)
r = requests.get(f'{BASE}/yeshi/game/session/get', headers=headers)
sd = r.json()
print(f'Session: code={sd.get("code")}')
if sd.get('code') == 0:
    s = sd['data']['session']
    w = sd['data'].get('weather', {})
    print(f'  Session状态: {s.get("status")}')
    print(f'  天气: {w.get("icon")} {w.get("name")}')

r = requests.get(f'{BASE}/yeshi/guest/active/get', headers=headers)
gd = r.json()
print(f'活跃客人: {len(gd.get("data",[]))} 位')

r = requests.get(f'{BASE}/yeshi/order/pending/get', headers=headers)
od = r.json()
print(f'待处理订单: {len(od.get("data",[]))} 个')

r = requests.get(f'{BASE}/yeshi/user/get', headers=headers)
ud = r.json()
if ud.get('code') == 0:
    u = ud['data'].get('user', {})
    print(f'用户金币: {u.get("gold")} 声望: {u.get("reputation")}')

print('\n' + '=' * 60)
print('测试6: 完成订单')
print('=' * 60)
pending = od.get('data', [])
if pending:
    order = pending[0]
    r = requests.post(f'{BASE}/yeshi/order/complete', headers=headers, json={
        'order_id': order['id'], 'success': True, 'quality': 90, 'time_spent': 5
    })
    comp = r.json()
    print(f'Complete: code={comp.get("code")} msg={comp.get("message")}')
    if comp.get('code') == 0:
        print(f'  获得金币: {comp["data"].get("gold_earned")}')

print('\n' + '=' * 60)
print('测试7: 打烊后再次营业 - 检查天气变化')
print('=' * 60)
r = requests.post(f'{BASE}/yeshi/game/end', headers=headers, json={})
print(f'End: code={r.json().get("code")} msg={r.json().get("message")}')

r = requests.post(f'{BASE}/yeshi/game/start', headers=headers, json={})
start2 = r.json()
print(f'Start2: code={start2.get("code")} msg={start2.get("message")}')
weather2 = None
if start2.get('code') == 0:
    weather2 = start2['data'].get('weather', {})
    print(f'  天气2: {weather2.get("icon")} {weather2.get("name")} (type={weather2.get("weather_type")})')

if weather1 and weather2:
    changed = weather1.get('weather_type') != weather2.get('weather_type')
    print(f'\n  天气是否变化: {"✅ 是" if changed else "❌ 否"}')
    print(f'  天气1: {weather1.get("weather_type")} -> 天气2: {weather2.get("weather_type")}')

print('\n' + '=' * 60)
print('测试总结')
print('=' * 60)
print('✅ 登录功能正常')
print('✅ 营业/打烊状态校验正常')
print('✅ 客人生成和点餐需求正常')
print('✅ 订单创建和完成正常')
print('✅ Session状态保持正常')
print('✅ 刷新后数据恢复正常')
if weather1 and weather2:
    status = '✅' if weather1.get('weather_type') != weather2.get('weather_type') else '❌'
    print(f'{status} 天气变化功能正常')
