#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""API测试脚本"""

import requests
import json

BASE_URL = 'http://localhost:8000'

def test_register():
    print('=== 测试注册 ===')
    resp = requests.post(f'{BASE_URL}/api/wordchain/register', 
                         json={'username': 'testuser2', 'password': '123456'})
    print(f'状态码: {resp.status_code}')
    result = resp.json()
    print(f'响应: {json.dumps(result, ensure_ascii=False, indent=2)}')
    return result

def test_login():
    print('\n=== 测试登录 ===')
    resp = requests.post(f'{BASE_URL}/api/auth/login',
                         json={'username': 'testuser2', 'password': '123456'})
    print(f'状态码: {resp.status_code}')
    result = resp.json()
    print(f'响应: {json.dumps(result, ensure_ascii=False, indent=2)}')
    return result

def test_start_game(token):
    print('\n=== 测试开始游戏 ===')
    headers = {'Authorization': f'Bearer {token}'}
    resp = requests.post(f'{BASE_URL}/api/wordchain/game/start', headers=headers)
    print(f'状态码: {resp.status_code}')
    result = resp.json()
    print(f'响应: {json.dumps(result, ensure_ascii=False, indent=2)}')
    return result

def test_submit_word(token, game_id, word):
    print(f'\n=== 测试提交词语: {word} ===')
    headers = {'Authorization': f'Bearer {token}'}
    resp = requests.post(f'{BASE_URL}/api/wordchain/game/submit', 
                         headers=headers,
                         json={'game_id': game_id, 'word': word})
    print(f'状态码: {resp.status_code}')
    result = resp.json()
    print(f'响应: {json.dumps(result, ensure_ascii=False, indent=2)}')
    return result

def test_get_user_stats(token):
    print('\n=== 测试获取用户统计 ===')
    headers = {'Authorization': f'Bearer {token}'}
    resp = requests.get(f'{BASE_URL}/api/wordchain/user/stats/get', headers=headers)
    print(f'状态码: {resp.status_code}')
    result = resp.json()
    print(f'响应: {json.dumps(result, ensure_ascii=False, indent=2)}')
    return result

def main():
    print('=' * 60)
    print('词语接龙 API 测试')
    print('=' * 60)
    
    # 注册
    register_result = test_register()
    if register_result['code'] != 0 and '已存在' not in register_result['message']:
        print('注册失败，退出测试')
        return
    
    # 登录
    login_result = test_login()
    if login_result['code'] != 0:
        print('登录失败，退出测试')
        return
    
    token = login_result['data']['token']
    
    # 开始游戏
    start_result = test_start_game(token)
    if start_result['code'] != 0:
        print('开始游戏失败，退出测试')
        return
    
    game_id = start_result['data']['game_id']
    start_word = start_result['data']['start_word']
    required_char = start_result['data']['current_last_char']
    
    print(f'\n起始词: {start_word}')
    print(f'需要以"{required_char}"开头接龙')
    
    # 测试提交一个错误的词（开头不对）
    test_submit_word(token, game_id, '测试')
    
    # 尝试找一个可以接龙的词
    # 假设起始词是"一心一意"，最后一个字是"意"
    # 我们需要一个以"意"开头的词
    test_words = ['意气风发', '意味深长', '意想不到']
    for word in test_words:
        if word[0] == required_char:
            result = test_submit_word(token, game_id, word)
            if result['code'] == 0 and not result['data'].get('game_over'):
                next_char = result['data']['next_required_char']
                print(f'\n接龙成功！下一个需要以"{next_char}"开头')
                
                # 再提交一个词
                next_words = ['长风破浪', '长驱直入', '长年累月']
                for w in next_words:
                    if w[0] == next_char:
                        test_submit_word(token, game_id, w)
                        break
            break
    
    # 获取用户统计
    test_get_user_stats(token)
    
    print('\n' + '=' * 60)
    print('测试完成！')
    print('=' * 60)

if __name__ == '__main__':
    main()
