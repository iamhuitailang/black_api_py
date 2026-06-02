import requests

BASE_URL = 'http://localhost:8451/api'

def login(username, password):
    r = requests.post(f'{BASE_URL}/majiang/user/login', 
                     json={'username': username, 'password': password})
    data = r.json()
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

def draw_tile(token):
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.post(f'{BASE_URL}/majiang/game/draw',
                     headers=headers)
    return r.json()

def discard_tile(token, tile_type, value):
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.post(f'{BASE_URL}/majiang/game/discard',
                     headers=headers,
                     json={'tile_type': tile_type, 'value': value})
    return r.json()

def hu(token):
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.post(f'{BASE_URL}/majiang/game/hu',
                     headers=headers)
    return r.json()

def main():
    username = 'test_hu_user'
    password = '123456'
    
    register(username, password)
    token = login(username, password)
    if not token:
        print('登录失败')
        return
    
    print('\n=== 创建测试游戏: seven_pairs_ready (七对子听牌) ===')
    result = create_test_game(token, 'seven_pairs_ready')
    print(f'结果: {result["msg"]}')
    if result['code'] == 0:
        d = result['data']
        tiles = d['my_hand']['tiles']
        print(f'手牌 ({len(tiles)}张): {[t["display"] for t in tiles]}')
        print(f'is_ready: {d["is_ready"]}')
        print(f'waiting_tiles: {len(d["waiting_tiles"])} 张')
        if d['waiting_tiles']:
            print(f'听的牌: {[t["display"] for t in d["waiting_tiles"]]}')
    
    print('\n=== 摸牌 ===')
    result = draw_tile(token)
    print(f'结果: {result["msg"]}')
    if result['code'] == 0:
        d = result['data']
        tiles = d['my_hand']['tiles']
        print(f'手牌 ({len(tiles)}张): {[t["display"] for t in tiles]}')
        print(f'is_ready: {d["is_ready"]}')
        print(f'can_hu: {d["can_hu"]}')
        
        if d['can_hu']:
            print('\n=== 可以胡牌！调用胡牌接口 ===')
            result = hu(token)
            print(f'胡牌结果: {result["msg"]}')
            if result['code'] == 0:
                print(f'番数: {result["data"]["fan"]}')
                print(f'番型: {result["data"]["fan_details"]}')
        else:
            print('\n=== 打出一张牌 ===')
            last_tile = tiles[-1]
            result = discard_tile(token, last_tile['type'], last_tile['value'])
            print(f'出牌结果: {result["msg"]}')
            if result['code'] == 0:
                d = result['data']
                print(f'出牌后 is_ready: {d["is_ready"]}')
                print(f'出牌后 waiting_tiles: {len(d.get("waiting_tiles", []))} 张')

if __name__ == '__main__':
    main()
