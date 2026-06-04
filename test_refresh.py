import requests, json

BASE = 'http://localhost:8000/api'

r = requests.post(f'{BASE}/auth/login', json={'username':'testuser','password':'123456'})
login_data = r.json()
print('1. Login:', login_data.get('code'), login_data.get('message'))
token = login_data['data']['token']
headers = {'Authorization': f'Bearer {token}'}

r = requests.get(f'{BASE}/yeshi/user/get', headers=headers)
user_data = r.json()
print('2. User:', user_data.get('code'))
if user_data.get('code') == 0:
    u = user_data['data'].get('user', {})
    print(f'   gold={u.get("gold")} level={u.get("level")} username={u.get("username")}')

r = requests.post(f'{BASE}/yeshi/game/start', headers=headers, json={})
start_data = r.json()
print('3. Start:', start_data.get('code'), start_data.get('message'))
if start_data.get('code') == 0:
    w = start_data['data'].get('weather', {})
    print(f'   weather: {w.get("icon")} {w.get("name")}')

r = requests.post(f'{BASE}/yeshi/guest/generate', headers=headers, json={})
guest_data = r.json()
print('4. Guest:', guest_data.get('code'), guest_data.get('message'))
if guest_data.get('code') == 0:
    g = guest_data['data']
    print(f'   {g.get("name")} wants {g.get("desired_food_icon","")} {g.get("desired_food_name","")}')

print('=== SIMULATE REFRESH ===')

r = requests.get(f'{BASE}/yeshi/game/session/get', headers=headers)
sd = r.json()
print('5. Session:', sd.get('code'), sd.get('message'))
if sd.get('code') == 0:
    s = sd['data']['session']
    print(f'   status={s.get("status")}')
    w = sd['data'].get('weather', {})
    print(f'   weather: {w.get("icon")} {w.get("name")}')
else:
    print('   NO ACTIVE SESSION - this is the bug!')

r = requests.get(f'{BASE}/yeshi/guest/active/get', headers=headers)
gd = r.json()
print('6. Guests:', gd.get('code'), f'count={len(gd.get("data",[]))}')

r = requests.get(f'{BASE}/yeshi/weather/get', headers=headers)
wd = r.json()
print('7. Weather:', wd.get('code'))
if wd.get('code') == 0:
    w = wd['data']
    print(f'   {w.get("icon")} {w.get("name")} modifier={w.get("customer_modifier")}')
