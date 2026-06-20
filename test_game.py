import urllib.request
import json

print("=== 测试游戏页面 ===")
try:
    req = urllib.request.Request('http://localhost:3080/static/dragongame/index.html')
    resp = urllib.request.urlopen(req, timeout=5)
    print(f"HTML 状态码: {resp.status}")
    content = resp.read().decode('utf-8')
    print(f"HTML 长度: {len(content)} 字符")
    print(f"包含 canvas: {'<canvas' in content}")
    print(f"包含 game.js: {'game.js' in content}")
except Exception as e:
    print(f"HTML 错误: {e}")

print("\n=== 测试游戏 API ===")
try:
    req = urllib.request.Request(
        'http://localhost:3080/api/dragongame/start',
        data=json.dumps({'player_name': 'TestPlayer'}).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    resp = urllib.request.urlopen(req, timeout=5)
    print(f"API 状态码: {resp.status}")
    data = json.loads(resp.read().decode('utf-8'))
    print(f"返回 code: {data.get('code')}")
    if data.get('data'):
        print(f"记录ID: {data['data'].get('record', {}).get('id')}")
        print(f"状态ID: {data['data'].get('dragon_status', {}).get('id')}")
except Exception as e:
    print(f"API 错误: {e}")

print("\n=== 测试排行榜 API ===")
try:
    req = urllib.request.Request('http://localhost:3080/api/dragongame/getleaderboard?limit=5')
    resp = urllib.request.urlopen(req, timeout=5)
    data = json.loads(resp.read().decode('utf-8'))
    print(f"返回 code: {data.get('code')}")
    print(f"记录数: {data.get('data', {}).get('count', 0)}")
except Exception as e:
    print(f"排行榜错误: {e}")

print("\n✅ 测试完成!")
