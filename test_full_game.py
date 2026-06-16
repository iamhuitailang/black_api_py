#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""完整流程测试脚本"""

import requests
import json

BASE_URL = 'http://localhost:8000'

def main():
    print('=' * 60)
    print('词语接龙 完整流程测试')
    print('=' * 60)
    
    # 登录
    print('\n1. 登录...')
    resp = requests.post(f'{BASE_URL}/api/auth/login',
                         json={'username': 'testuser2', 'password': '123456'})
    result = resp.json()
    if result['code'] != 0:
        print(f'登录失败: {result["message"]}')
        return
    
    token = result['data']['token']
    user_id = result['data']['user']['id']
    print(f'登录成功，用户ID: {user_id}')
    headers = {'Authorization': f'Bearer {token}'}
    
    # 开始游戏
    print('\n2. 开始游戏...')
    resp = requests.post(f'{BASE_URL}/api/wordchain/game/start', headers=headers)
    result = resp.json()
    if result['code'] != 0:
        print(f'开始游戏失败: {result["message"]}')
        return
    
    game_id = result['data']['game_id']
    start_word = result['data']['start_word']
    required_char = result['data']['current_last_char']
    print(f'游戏ID: {game_id}')
    print(f'起始词: {start_word} (长度: {len(start_word)})')
    print(f'需要以"{required_char}"开头接龙')
    
    # 找一个可以接龙的词
    print(f'\n3. 查询以"{required_char}"开头的常用词...')
    from app.model.wordchain import WordModel
    word_model = WordModel()
    words = word_model.get_words_starting_with(required_char, limit=10)
    print(f'找到 {len(words)} 个词:')
    for w in words[:5]:
        print(f'  - {w["word"]} (长度: {w["length"]}, 频率: {w["frequency"]})')
    
    if not words:
        print('没有找到可以接龙的词，测试结束')
        return
    
    # 选择第一个词进行接龙
    test_word = words[0]['word']
    print(f'\n4. 提交词语: {test_word}')
    resp = requests.post(f'{BASE_URL}/api/wordchain/game/submit', 
                         headers=headers,
                         json={'game_id': game_id, 'word': test_word})
    result = resp.json()
    print(f'响应: {json.dumps(result, ensure_ascii=False, indent=2)}')
    
    if result['code'] == 0 and not result['data'].get('game_over'):
        score = result['data']['score']
        total_score = result['data']['total_score']
        next_char = result['data']['next_required_char']
        streak = result['data']['winning_streak']
        is_bonus = result['data'].get('is_streak_bonus', False)
        
        print(f'\n接龙成功!')
        print(f'  本轮得分: {score}分 {"(连胜加成×2)" if is_bonus else ""}')
        print(f'  总分: {total_score}分')
        print(f'  连胜: {streak}轮')
        print(f'  下一个需要以"{next_char}"开头')
        
        # 再接龙一次
        print(f'\n5. 查找以"{next_char}"开头的词...')
        words2 = word_model.get_words_starting_with(next_char, limit=5)
        if words2:
            test_word2 = words2[0]['word']
            print(f'提交词语: {test_word2}')
            resp = requests.post(f'{BASE_URL}/api/wordchain/game/submit', 
                                 headers=headers,
                                 json={'game_id': game_id, 'word': test_word2})
            result = resp.json()
            if result['code'] == 0:
                print(f'第二次接龙成功! 总分: {result["data"].get("total_score", 0)}')
    
    # 获取用户统计
    print('\n6. 获取用户统计...')
    resp = requests.get(f'{BASE_URL}/api/wordchain/user/stats/get', headers=headers)
    result = resp.json()
    if result['code'] == 0:
        stats = result['data']['stats']
        print(f'  总场数: {stats["total_games"]}')
        print(f'  胜场: {stats["wins"]}')
        print(f'  胜率: {stats["win_rate"]}%')
        print(f'  最长连胜: {stats["max_winning_streak"]}轮')
        print(f'  最高分: {stats["best_score"]}分')
        
        first_chars = result['data']['first_char_stats']
        if first_chars:
            print(f'  最常用首字:')
            for item in first_chars[:5]:
                print(f'    - {item["first_char"]}: {item["count"]}次')
    
    print('\n' + '=' * 60)
    print('测试完成！')
    print(f'\n前端页面地址:')
    print(f'  登录页: http://localhost:8000/static/wordchain/index.html')
    print(f'  游戏页: http://localhost:8000/static/wordchain/game.html')
    print(f'  个人中心: http://localhost:8000/static/wordchain/profile.html')
    print(f'  API文档: http://localhost:8000/docs')
    print('=' * 60)

if __name__ == '__main__':
    main()
