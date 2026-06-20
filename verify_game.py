import urllib.request
import re

print("=== 测试游戏页面和资源加载 ===\n")

# 1. 测试 HTML 页面
print("[1] 测试 HTML 页面...")
try:
    req = urllib.request.Request('http://localhost:3080/static/dragongame/index.html')
    resp = urllib.request.urlopen(req, timeout=5)
    html = resp.read().decode('utf-8')
    print(f"    HTML 状态码: {resp.status}")
    print(f"    HTML 大小: {len(html)} 字节")
    
    # 检查关键元素是否存在
    checks = [
        ('startScreen', '开始界面'),
        ('gameScreen', '游戏界面'),
        ('gameOverScreen', '结束界面'),
        ('gameCanvas', '游戏画布'),
        ('playerName', '昵称输入框'),
        ('hpBarFill', '血条'),
        ('flameBarFill', '蓄力条'),
        ('waveNumber', '波次显示'),
        ('style.css', 'CSS 样式引用'),
        ('game.js', 'JS 脚本引用'),
        ('onclick="startGame()"', '开始游戏按钮'),
    ]
    all_ok = True
    for needle, name in checks:
        if needle in html:
            print(f"    ✅ {name} 存在")
        else:
            print(f"    ❌ {name} 缺失!")
            all_ok = False
except Exception as e:
    print(f"    ❌ HTML 加载失败: {e}")
    all_ok = False

# 2. 测试 CSS 文件
print("\n[2] 测试 CSS 文件...")
try:
    req = urllib.request.Request('http://localhost:3080/static/dragongame/style.css')
    resp = urllib.request.urlopen(req, timeout=5)
    css = resp.read().decode('utf-8')
    print(f"    CSS 状态码: {resp.status}")
    print(f"    CSS 大小: {len(css)} 字节")
    css_checks = [
        ('.start-screen', '开始界面样式'),
        ('.game-screen', '游戏界面样式'),
        ('.game-canvas', '画布样式'),
        ('.hp-bar-fill', '血条样式'),
        ('.flame-bar-fill', '蓄力条样式'),
        ('.wave-banner', '波次横幅'),
        ('@keyframes shake', '抖动动画'),
        ('#gameCanvas', '画布强制显示'),
    ]
    for needle, name in css_checks:
        if needle in css:
            print(f"    ✅ {name} 存在")
        else:
            print(f"    ❌ {name} 缺失!")
except Exception as e:
    print(f"    ❌ CSS 加载失败: {e}")

# 3. 测试 JS 文件
print("\n[3] 测试 JS 文件...")
try:
    req = urllib.request.Request('http://localhost:3080/static/dragongame/game.js')
    resp = urllib.request.urlopen(req, timeout=5)
    js = resp.read().decode('utf-8')
    print(f"    JS 状态码: {resp.status}")
    print(f"    JS 大小: {len(js)} 字节")
    
    js_checks = [
        ('function startGame(', '开始游戏函数'),
        ('function initGame(', '初始化函数'),
        ('function gameLoop(', '游戏主循环'),
        ('function render(', '渲染函数'),
        ('function drawDragon(', '绘制龙'),
        ('function drawEnemies(', '绘制敌人'),
        ('GAME_WIDTH = 1200', '画布尺寸常量'),
        ('gameState !== \'playing\'', '游戏状态判断'),
        ('昵称校验', '昵称校验注释'),
        ('initCanvasSize', 'canvas 首帧修复'),
        ('document.getElementById(\'playerName\')', '昵称获取'),
        ('!name', '空昵称判断'),
        ('requestAnimationFrame(gameLoop)', '启动游戏循环'),
        ('function updateDragon(', '龙的更新'),
        ('function updateEnemies(', '敌人的更新'),
    ]
    for needle, name in js_checks:
        if needle in js:
            print(f"    ✅ {name} 存在")
        else:
            print(f"    ❌ {name} 缺失!")
            all_ok = False
except Exception as e:
    print(f"    ❌ JS 加载失败: {e}")

# 4. 测试 /game 跳转
print("\n[4] 测试 /game 入口路由...")
try:
    req = urllib.request.Request('http://localhost:3080/game')
    resp = urllib.request.urlopen(req, timeout=5)
    print(f"    /game 状态码: {resp.status}")
    print(f"    最终URL: {resp.geturl()}")
    if 'dragongame' in resp.geturl():
        print("    ✅ 正确跳转到 dragongame 页面")
    else:
        print("    ⚠ 跳转路径待确认")
except Exception as e:
    print(f"    ❌ /game 路由失败: {e}")

# 5. 测试 API
print("\n[5] 测试游戏 API（POST /start）...")
import json
try:
    req = urllib.request.Request(
        'http://localhost:3080/api/dragongame/start',
        data=json.dumps({'player_name': 'TestUser'}).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    resp = urllib.request.urlopen(req, timeout=5)
    data = json.loads(resp.read().decode('utf-8'))
    print(f"    POST /start 状态码: {resp.status}")
    print(f"    返回 code: {data.get('code')}")
    if data.get('code') == 0:
        print("    ✅ API 返回正确")
        print(f"       记录ID: {data['data']['record']['id']}")
        print(f"       状态ID: {data['data']['dragon_status']['id']}")
    else:
        print(f"    ❌ API 返回异常: {data}")
except Exception as e:
    print(f"    ❌ API 调用失败: {e}")

print("\n==========================================")
print(f"{'所有测试通过 ✅' if all_ok else '存在问题，请检查 ⚠'}")
print("==========================================")
print()
print("👉 访问地址:")
print("   游戏入口: http://localhost:3080/game")
print("   直接路径: http://localhost:3080/static/dragongame/index.html")
print("   API文档 : http://localhost:3080/docs")
