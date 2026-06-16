#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""修复验证测试脚本"""

import requests
import json

BASE_URL = 'http://localhost:8890'

def test_random_start_words():
    print('=' * 60)
    print('测试1: 验证起始词随机性（连续10次开局）')
    print('=' * 60)
    
    resp = requests.post(f'{BASE_URL}/api/auth/login',
                         json={'username': 'testuser2', 'password': '123456'})
    result = resp.json()
    if result['code'] != 0:
        print(f'登录失败: {result["message"]}')
        return
    
    token = result['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    start_words = []
    for i in range(10):
        resp = requests.post(f'{BASE_URL}/api/wordchain/game/start', headers=headers)
        result = resp.json()
        if result['code'] == 0:
            word = result['data']['start_word']
            game_id = result['data']['game_id']
            start_words.append(word)
            print(f'  第{i+1}局: {word}')
            
            resp = requests.post(f'{BASE_URL}/api/wordchain/game/timeout', 
                                headers=headers,
                                json={'game_id': game_id})
        else:
            print(f'  第{i+1}局: 失败 - {result["message"]}')
    
    unique_words = list(set(start_words))
    print(f'\n统计: 共{len(start_words)}局, 不同词语{len(unique_words)}个')
    if len(unique_words) >= 5:
        print('✅ 通过: 起始词具有足够的随机性')
    else:
        print('⚠️  警告: 起始词重复度较高')
    print()

def test_resume_game():
    print('=' * 60)
    print('测试2: 验证游戏恢复功能')
    print('=' * 60)
    
    resp = requests.post(f'{BASE_URL}/api/auth/login',
                         json={'username': 'testuser2', 'password': '123456'})
    result = resp.json()
    if result['code'] != 0:
        print(f'登录失败: {result["message"]}')
        return
    
    token = result['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    print('1. 开始新游戏...')
    resp = requests.post(f'{BASE_URL}/api/wordchain/game/start', headers=headers)
    result = resp.json()
    if result['code'] != 0:
        print(f'开始游戏失败: {result["message"]}')
        return
    
    game_id = result['data']['game_id']
    start_word = result['data']['start_word']
    required_char = result['data']['current_last_char']
    print(f'   游戏ID: {game_id}, 起始词: {start_word}, 需要以"{required_char}"开头')
    
    print('\n2. 接龙一个词...')
    from app.model.wordchain import WordModel
    word_model = WordModel()
    words = word_model.get_words_starting_with(required_char, limit=3)
    if words:
        test_word = words[0]['word']
        print(f'   接龙词: {test_word}')
        resp = requests.post(f'{BASE_URL}/api/wordchain/game/submit', 
                            headers=headers,
                            json={'game_id': game_id, 'word': test_word})
        result = resp.json()
        if result['code'] == 0 and not result['data'].get('game_over'):
            print(f'   接龙成功! 得分: +{result["data"]["score"]}, 总分: {result["data"]["total_score"]}')
            print(f'   下一个需要以"{result["data"]["next_required_char"]}"开头')
        else:
            print(f'   接龙结果: {json.dumps(result, ensure_ascii=False)}')
    
    print('\n3. 调用恢复游戏接口...')
    resp = requests.get(f'{BASE_URL}/api/wordchain/game/resume/get', headers=headers)
    result = resp.json()
    
    if result['code'] == 0 and result['data']['has_unfinished']:
        game = result['data']['game']
        rounds = result['data']['rounds']
        
        print(f'   ✅ 成功找到未完成游戏!')
        print(f'   游戏ID: {game["id"]}, 状态: {game["status"]}')
        print(f'   当前得分: {game["score"]}, 回合数: {game["round_count"]}')
        print(f'   连胜: {game["winning_streak"]}, 需要以"{game["current_last_char"]}"开头')
        print(f'   历史回合数: {len(rounds)}')
        for i, r in enumerate(rounds):
            print(f'     - 第{i+1}轮: [{r["source"]}] {r["word"]} ({r["result"]}) +{r["score"]}分')
        print('\n✅ 通过: 游戏恢复功能正常工作')
    else:
        print(f'   ❌ 未找到未完成游戏: {json.dumps(result, ensure_ascii=False)}')
    
    print()
    print('清理: 结束测试游戏...')
    resp = requests.post(f'{BASE_URL}/api/wordchain/game/timeout', 
                        headers=headers,
                        json={'game_id': game_id})
    print('完成!')

def main():
    test_random_start_words()
    test_resume_game()
    
    print('\n' + '=' * 60)
    print('测试完成！前端请访问:')
    print(f'  登录页: {BASE_URL}/static/wordchain/index.html')
    print(f'  游戏页: {BASE_URL}/static/wordchain/game.html')
    print('=' * 60)

if __name__ == '__main__':
    main()
