import requests
import json
import sys

BASE_URL = 'http://localhost:8451/api'

def login(username, password):
    r = requests.post(f'{BASE_URL}/majiang/user/login', 
                     json={'username': username, 'password': password})
    data = r.json()
    if data['code'] == 0:
        return data['data']['token']
    return None

def register(username, password):
    r = requests.post(f'{BASE_URL}/majiang/user/register', 
                     json={'username': username, 'password': password, 'nickname': 'test'})
    return r.json()

def create_game(token, difficulty=1):
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.post(f'{BASE_URL}/majiang/game/create',
                     headers=headers,
                     params={'difficulty': difficulty})
    return r.json()

def get_state(token):
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.get(f'{BASE_URL}/majiang/game/state/get',
                    headers=headers)
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

def cancel_game(token):
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.post(f'{BASE_URL}/majiang/game/cancel',
                     headers=headers)
    return r.json()

def test():
    username = 'test_ready_' + ''.join([str(i) for i in range(5)])
    password = '123456'
    
    print(f'注册用户: {username}')
    result = register(username, password)
    print(f'注册结果: {result["msg"]}')
    
    token = login(username, password)
    if not token:
        print('登录失败')
        return
    
    print('\n=== 第1局: 看看初始牌 ===')
    result = create_game(token, difficulty=1)
    print(f'创建游戏: {result["msg"]}')
    
    result = get_state(token)
    if result['code'] == 0:
        d = result['data']
        tiles = d['my_hand']['tiles']
        print(f'我的手牌 ({len(tiles)}张): {[t["display"] for t in tiles]}')
        print(f'是否听牌: {d["is_ready"]}')
        print(f'听牌数量: {len(d["waiting_tiles"])}')
        if d['waiting_tiles']:
            print(f'听的牌: {[t["display"] for t in d["waiting_tiles"]]}')
    
    cancel_game(token)
    
    print('\n=== 第2局: 看看初始牌 ===')
    result = create_game(token, difficulty=1)
    print(f'创建游戏: {result["msg"]}')
    
    result = get_state(token)
    if result['code'] == 0:
        d = result['data']
        tiles = d['my_hand']['tiles']
        print(f'我的手牌 ({len(tiles)}张): {[t["display"] for t in tiles]}')
        print(f'是否听牌: {d["is_ready"]}')
        print(f'听牌数量: {len(d["waiting_tiles"])}')
        if d['waiting_tiles']:
            print(f'听的牌: {[t["display"] for t in d["waiting_tiles"]]}')
    
    print('\n=== 现在摸一张牌 ===')
    result = draw_tile(token)
    if result['code'] == 0:
        d = result['data']
        tiles = d['my_hand']['tiles']
        print(f'摸牌后手牌 ({len(tiles)}张): {[t["display"] for t in tiles]}')
        print(f'是否听牌: {d["is_ready"]}')
        print(f'听牌数量: {len(d["waiting_tiles"])}')
        print(f'是否能胡: {d["can_hu"]}')
        
        print('\n=== 打出最后一张牌 ===')
        last_tile = tiles[-1]
        result = discard_tile(token, last_tile['type'], last_tile['value'])
        if result['code'] == 0:
            d = result['data']
            print(f'出牌后是否听牌: {d["is_ready"]}')
            print(f'听牌数量: {len(d.get("waiting_tiles", []))}')
    
    print('\n=== 再次获取状态验证 ===')
    result = get_state(token)
    if result['code'] == 0:
        d = result['data']
        tiles = d['my_hand']['tiles']
        print(f'状态中手牌 ({len(tiles)}张): {[t["display"] for t in tiles]}')
        print(f'状态中是否听牌: {d["is_ready"]}')
        print(f'状态中听牌数量: {len(d["waiting_tiles"])}')
        print(f'状态中是否能胡: {d["can_hu"]}')

if __name__ == '__main__':
    test()
