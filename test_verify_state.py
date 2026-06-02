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

def test():
    username = 'test_verify'
    password = '123456'
    
    print(f'注册用户: {username}')
    result = register(username, password)
    print(f'注册结果: {result["msg"]}')
    
    token = login(username, password)
    if not token:
        print('登录失败')
        return
    
    print('\n=== 创建游戏 ===')
    result = create_game(token, difficulty=1)
    print(f'创建游戏: {result["msg"]}')
    
    print('\n=== 现在用数据库直接查看状态 ===')
    import sqlite3
    conn = sqlite3.connect('game.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM tb_majiang_model_game_state ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    print(f'游戏状态记录: {row[0]}')
    
    state_data = json.loads(row[3])
    player_hand = state_data['hands']['player']
    tiles = player_hand['tiles']
    print(f'手牌: {[t["display"] for t in tiles]}')
    print(f'手牌数: {len(tiles)}')
    
    print('\n=== 现在直接用代码检测这副牌 ===')
    sys.path.insert(0, '/Users/sunmengmeng/works/solo-coder/github0601/060206')
    from app.model.majiang_model import MahjongTile, MahjongHand, MahjongWinChecker
    
    hand = MahjongHand()
    for t in tiles:
        hand.add_tile(MahjongTile.from_dict(t))
    
    print(f'MahjongHand对象牌数: {hand.get_tile_count()}')
    print(f'牌: {[str(t) for t in hand.tiles]}')
    
    is_ready, waiting = MahjongWinChecker.is_ready_hand(hand)
    print(f'is_ready_hand检测结果: is_ready={is_ready}, waiting={len(waiting)}张')
    
    if is_ready:
        print(f'听的牌: {[str(t) for t in waiting]}')
    
    print('\n=== 数据库中保存的is_ready ===')
    print(f"is_ready.player = {state_data.get('is_ready', {}).get('player')}")
    print(f"waiting_tiles.player = {len(state_data.get('waiting_tiles', {}).get('player', []))}张")
    
    conn.close()
    
    print('\n=== 现在调用API获取状态 ===')
    result = get_state(token)
    if result['code'] == 0:
        d = result['data']
        print(f'API返回 is_ready: {d["is_ready"]}')
        print(f'API返回 waiting_tiles: {len(d["waiting_tiles"])}张')

if __name__ == '__main__':
    test()
