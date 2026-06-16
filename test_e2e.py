import requests, json

BASE = 'http://localhost:8890'

r = requests.post(f'{BASE}/api/auth/login', json={'username':'testuser2','password':'123456'})
token = r.json()['data']['token']
h = {'Authorization': f'Bearer {token}'}

print('=== 步骤1: 开始游戏 ===')
r = requests.post(f'{BASE}/api/wordchain/game/start', headers=h)
d = r.json()
game1_id = d['data']['game_id']
game1_word = d['data']['start_word']
game1_char = d['data']['current_last_char']
print(f'游戏ID: {game1_id}, 起始词: {game1_word}, 尾字: {game1_char}')

from app.model.wordchain import WordModel
wm = WordModel()
words = wm.get_words_starting_with(game1_char, limit=5)
if words:
    test_word = words[0]['word']
    print(f'\n=== 步骤2: 接龙 {test_word} ===')
    r = requests.post(f'{BASE}/api/wordchain/game/submit', headers=h, json={'game_id': game1_id, 'word': test_word})
    d = r.json()
    if d['code'] == 0 and not d['data'].get('game_over'):
        print(f'接龙成功! 总分: {d["data"]["total_score"]}, 下一个尾字: {d["data"]["next_required_char"]}')
    else:
        print(f'接龙结果: {d["message"]}')

print(f'\n=== 步骤3: 模拟刷新 - 恢复游戏 ===')
r = requests.get(f'{BASE}/api/wordchain/game/resume/get', headers=h)
d = r.json()
if d['code'] == 0 and d['data']['has_unfinished']:
    g = d['data']['game']
    rs = d['data']['rounds']
    print(f'✅ 恢复成功! 游戏ID: {g["id"]}, 得分: {g["score"]}, 尾字: {g["current_last_char"]}')
    print(f'   回合数: {len(rs)}')
    for r_item in rs:
        print(f'     [{r_item["source"]}] {r_item["word"]} (+{r_item["score"]}分)')
else:
    print(f'❌ 恢复失败: {json.dumps(d, ensure_ascii=False)}')

print(f'\n=== 步骤4: 再来一局 ===')
r = requests.post(f'{BASE}/api/wordchain/game/timeout', headers=h, json={'game_id': game1_id})
print(f'旧游戏已结束')

r = requests.post(f'{BASE}/api/wordchain/game/start', headers=h)
d = r.json()
game2_id = d['data']['game_id']
game2_word = d['data']['start_word']
print(f'新游戏ID: {game2_id}, 起始词: {game2_word}')
if game1_word != game2_word:
    print(f'✅ 再来一局起始词不同! "{game1_word}" → "{game2_word}"')
else:
    print(f'⚠️ 起始词相同: "{game2_word}"')

r = requests.post(f'{BASE}/api/wordchain/game/start', headers=h)
d2 = r.json()
game3_word = d2['data']['start_word']
requests.post(f'{BASE}/api/wordchain/game/timeout', headers=h, json={'game_id': d2['data']['game_id']})
r = requests.post(f'{BASE}/api/wordchain/game/start', headers=h)
d3 = r.json()
game4_word = d3['data']['start_word']
requests.post(f'{BASE}/api/wordchain/game/timeout', headers=h, json={'game_id': d3['data']['game_id']})

all_words = [game1_word, game2_word, game3_word, game4_word]
unique = len(set(all_words))
print(f'\n4局起始词: {all_words}')
print(f'不同词数: {unique}/4')

print(f'\n前端页面: {BASE}/static/wordchain/game.html')
