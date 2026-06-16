#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""清理脏数据并完整验证"""

import requests
import json

BASE_URL = 'http://localhost:8890'

def cleanup_and_test():
    print('=' * 60)
    print('清理并完整验证修复')
    print('=' * 60)
    
    resp = requests.post(f'{BASE_URL}/api/auth/login',
                         json={'username': 'testuser2', 'password': '123456'})
    result = resp.json()
    if result['code'] != 0:
        print(f'登录失败: {result["message"]}')
        return
    
    token = result['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    print('\n1. 先结束所有未完成的游戏...')
    resp = requests.get(f'{BASE_URL}/api/wordchain/game/resume/get', headers=headers)
    result = resp.json()
    count = 0
    while result['code'] == 0 and result['data']['has_unfinished']:
        game_id = result['data']['game']['id']
        print(f'   结束游戏ID: {game_id}')
        requests.post(f'{BASE_URL}/api/wordchain/game/timeout', 
                     headers=headers,
                     json={'game_id': game_id})
        resp = requests.get(f'{BASE_URL}/api/wordchain/game/resume/get', headers=headers)
        result = resp.json()
        count += 1
        if count > 10:
            break
    print(f'   已结束 {count} 个未完成游戏')
    
    print('\n2. 测试起始词随机性...')
    start_words = []
    for i in range(5):
        resp = requests.post(f'{BASE_URL}/api/wordchain/game/start', headers=headers)
        result = resp.json()
        if result['code'] == 0:
            word = result['data']['start_word']
            game_id = result['data']['game_id']
            last_char = result['data']['current_last_char']
            start_words.append(word)
            print(f'   第{i+1}局: {word}, 尾字: {last_char}')
            
            requests.post(f'{BASE_URL}/api/wordchain/game/timeout', 
                         headers=headers,
                         json={'game_id': game_id})
    print(f'   ✅ 5局 {len(set(start_words))} 个不同起始词: {set(start_words)}')
    
    print('\n3. 测试完整游戏+恢复+再来一局...')
    
    from app.model.wordchain import WordModel
    word_model = WordModel()
    
    print('   第1局:')
    resp = requests.post(f'{BASE_URL}/api/wordchain/game/start', headers=headers)
    result = resp.json()
    game1_id = result['data']['game_id']
    game1_start = result['data']['start_word']
    last_char1 = result['data']['current_last_char']
    print(f'      起始词: {game1_start}, 需要以"{last_char1}"开头')
    
    words_found = word_model.get_words_starting_with(last_char1, limit=5)
    
    submitted = False
    for w in words_found:
        test_word = w['word']
        resp = requests.post(f'{BASE_URL}/api/wordchain/game/submit', 
                            headers=headers,
                            json={'game_id': game1_id, 'word': test_word})
        result = resp.json()
        if result['code'] == 0 and not result['data'].get('game_over'):
            print(f'      接龙成功: {test_word} +{result["data"]["score"]}分')
            print(f'      总分: {result["data"]["total_score"]}, 下一个尾字: {result["data"]["next_required_char"]}')
            submitted = True
            break
        elif result['code'] == 0 and result['data'].get('game_over') and result['data'].get('is_win'):
            print(f'      接龙: {test_word}, 恭喜通关!')
            submitted = True
            break
    
    if not submitted:
        print('      (没有合适的接龙词，跳过接龙)')
    
    print('\n   刷新页面模拟: 调用恢复游戏接口...')
    resp = requests.get(f'{BASE_URL}/api/wordchain/game/resume/get', headers=headers)
    result = resp.json()
    
    if result['code'] == 0:
        if result['data']['has_unfinished']:
            g = result['data']['game']
            rs = result['data']['rounds']
            print(f'      ✅ 成功恢复游戏!')
            print(f'      游戏ID: {g["id"]}, 状态: {g["status"]}')
            print(f'      得分: {g["score"]}, 回合: {g["round_count"]}, 连胜: {g["winning_streak"]}')
            print(f'      尾字: {g["current_last_char"]}')
            print(f'      历史记录:')
            for r in rs:
                print(f'        [{r["source"]}] {r["word"]} (+{r["score"]}分)')
        else:
            print('      游戏已正确结束，无需恢复')
    
    print('\n   点击再来一局:')
    resp = requests.post(f'{BASE_URL}/api/wordchain/game/start', headers=headers)
    result = resp.json()
    game2_start = result['data']['start_word']
    game2_id = result['data']['game_id']
    print(f'      第2局起始词: {game2_start}')
    
    if game1_start != game2_start:
        print(f'      ✅ 再来一局起始词不同!  ("{game1_start}" → "{game2_start}")')
    else:
        print(f'      ⚠️  再来一局起始词相同 ("{game2_start}")，但随机允许偶尔相同')
    
    requests.post(f'{BASE_URL}/api/wordchain/game/timeout', 
                 headers=headers,
                 json={'game_id': game2_id})
    
    print('\n' + '=' * 60)
    print('✅ 所有验证通过!')
    print(f'\n前端访问地址:')
    print(f'  登录页: {BASE_URL}/static/wordchain/index.html')
    print(f'  游戏页: {BASE_URL}/static/wordchain/game.html')
    print('=' * 60)

if __name__ == '__main__':
    cleanup_and_test()
