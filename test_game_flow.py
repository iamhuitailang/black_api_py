import requests
import json

BASE_URL = 'http://localhost:8451/api'

def login(username, password):
    r = requests.post(f'{BASE_URL}/majiang/user/login', 
                     json={'username': username, 'password': password})
    data = r.json()
    print(f'登录: {data["msg"]}')
    if data['code'] == 0:
        return data['data']['token']
    return None

def create_game(token, difficulty='easy'):
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.post(f'{BASE_URL}/majiang/game/create',
                     headers=headers,
                     json={'difficulty': difficulty})
    data = r.json()
    print(f'创建游戏: {data["msg"]}')
    return data

def get_state(token):
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.get(f'{BASE_URL}/majiang/game/state/get',
                    headers=headers)
    data = r.json()
    if data['code'] == 0:
        d = data['data']
        print(f'=== 游戏状态 ===')
        print(f'当前玩家: {d["current_player"]}')
        print(f'是否我的回合: {d["is_my_turn"]}')
        print(f'是否听牌: {d["is_ready"]}')
        print(f'等待的牌: {len(d["waiting_tiles"])} 张')
        print(f'是否能胡: {d["can_hu"]}')
        print(f'剩余牌数: {d["tiles_remaining"]}')
        print(f'我的手牌数: {len(d["my_hand"]["tiles"])}')
        print(f'我的副露数: {len(d["my_hand"]["melds"])}')
        print(f'总牌数: {len(d["my_hand"]["tiles"]) + sum(len(m) for m in d["my_hand"]["melds"])}')
    return data

def draw_tile(token):
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.post(f'{BASE_URL}/majiang/game/draw',
                     headers=headers)
    data = r.json()
    print(f'\n=== 摸牌 ===')
    print(f'结果: {data["msg"]}')
    if data['code'] == 0:
        d = data['data']
        print(f'手牌数: {len(d["my_hand"]["tiles"])}')
        print(f'是否听牌: {d["is_ready"]}')
        print(f'等待的牌: {len(d["waiting_tiles"])} 张')
        print(f'是否能胡: {d["can_hu"]}')
    return data

def discard_tile(token, tile_type, value):
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.post(f'{BASE_URL}/majiang/game/discard',
                     headers=headers,
                     json={'tile_type': tile_type, 'value': value})
    data = r.json()
    print(f'\n=== 出牌: {tile_type} {value} ===')
    print(f'结果: {data["msg"]}')
    if data['code'] == 0:
        d = data['data']
        print(f'手牌数: {len(d["my_hand"]["tiles"])}')
        print(f'是否听牌: {d["is_ready"]}')
        print(f'等待的牌: {len(d["waiting_tiles"])} 张')
    return data

def ai_play(token):
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.post(f'{BASE_URL}/majiang/game/ai/play',
                     headers=headers)
    data = r.json()
    print(f'\n=== AI出牌 ===')
    print(f'结果: {data["msg"]}')
    if data['code'] == 0:
        d = data['data']
        if d.get('game_over'):
            print(f'游戏结束！赢家: {d.get("winner")}')
        else:
            print(f'AI: {d["ai_player"]}, 打出: {d["discarded_tile"]["display"]}')
    return data

def main():
    token = login('test123', 'test123')
    if not token:
        print('登录失败')
        return

    result = create_game(token)
    if result['code'] != 0:
        print('创建游戏失败')
        return

    print('\n--- 初始状态 ---')
    get_state(token)

    print('\n--- 玩家回合 ---')
    result = draw_tile(token)
    if result['code'] != 0:
        return
    
    if result['data'].get('can_hu'):
        print('可以胡牌了！')
        return
    
    tiles = result['data']['my_hand']['tiles']
    if len(tiles) == 14:
        tile = tiles[-1]
        discard_tile(token, tile['type'], tile['value'])
    
    print('\n--- AI回合 ---')
    for i in range(3):
        result = ai_play(token)
        if result['code'] != 0 or result['data'].get('game_over'):
            break
    
    print('\n--- 再次获取状态 ---')
    get_state(token)

if __name__ == '__main__':
    main()
