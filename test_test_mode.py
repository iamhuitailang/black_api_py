import requests

BASE_URL = 'http://localhost:8451/api'

def login(username, password):
    r = requests.post(f'{BASE_URL}/majiang/user/login', 
                     json={'username': username, 'password': password})
    data = r.json()
    print(f'登录: {data["msg"]}')
    if data['code'] == 0:
        return data['data']['token']
    return None

def register(username, password):
    try:
        r = requests.post(f'{BASE_URL}/majiang/user/register', 
                         json={'username': username, 'password': password, 'nickname': 'test'})
        return r.json()
    except:
        return None

def create_test_game(token, test_type='ready'):
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.post(f'{BASE_URL}/majiang/game/test/create',
                     headers=headers,
                     params={'test_type': test_type})
    return r.json()

def get_state(token):
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.get(f'{BASE_URL}/majiang/game/state/get',
                    headers=headers)
    return r.json()

def main():
    username = 'test_mode_user'
    password = '123456'
    
    register(username, password)
    token = login(username, password)
    if not token:
        print('登录失败')
        return
    
    print('\n=== 创建测试游戏: ready (听牌) ===')
    result = create_test_game(token, 'ready')
    print(f'结果: {result["msg"]}')
    if result['code'] == 0:
        d = result['data']
        tiles = d['my_hand']['tiles']
        print(f'手牌 ({len(tiles)}张): {[t["display"] for t in tiles]}')
        print(f'is_ready: {d["is_ready"]}')
        print(f'waiting_tiles: {len(d["waiting_tiles"])} 张')
        if d['waiting_tiles']:
            print(f'听的牌: {[t["display"] for t in d["waiting_tiles"]]}')
    
    print('\n=== 再次获取状态验证 ===')
    result = get_state(token)
    if result['code'] == 0:
        d = result['data']
        print(f'state中 is_ready: {d["is_ready"]}')
        print(f'state中 waiting_tiles: {len(d["waiting_tiles"])} 张')
        print(f'state中 can_hu: {d["can_hu"]}')

if __name__ == '__main__':
    main()
