import urllib.request, json

BASE = 'http://localhost:8001/api'

def get(path, params=None, token=None):
    from urllib.parse import urlencode
    url = BASE + path
    if params:
        url += '?' + urlencode({k: v for k, v in params.items() if v})
    headers = {'X-Client-ID': 'test_client_001'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(url, headers=headers)
    return json.loads(urllib.request.urlopen(req).read())

def post(path, data, cid='test_client_001', token=None):
    payload = json.dumps(data).encode('utf-8')
    headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': cid
    }
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(BASE + path, data=payload, headers=headers)
    return json.loads(urllib.request.urlopen(req).read())

print("=== 测试1: 管理接口无token访问（应返回401）===")
res = get('/admin/review/list/get')
print(f"  code={res['code']}, message={res['message']}")
assert res['code'] == 401, f"期望401，实际{res['code']}"
print("  ✅ 通过")

print("\n=== 测试2: 管理员登录 ===")
res = post('/auth/login', {'username': 'admin', 'password': 'admin123'})
print(f"  code={res['code']}, message={res['message']}")
assert res['code'] == 0, f"登录失败: {res['message']}"
token = res['data']['token']
print(f"  ✅ 通过, token={token[:20]}...")

print("\n=== 测试3: 带token访问管理接口 ===")
res = get('/admin/review/list/get', token=token)
print(f"  code={res['code']}, 评价数={len(res['data']['items'])}")
assert res['code'] == 0
print("  ✅ 通过")

print("\n=== 测试4: 同一客户端重复评价（应被拒绝）===")
res1 = post('/review/submit', {
    'semester': '2025-2026-2',
    'course_name': '算法设计与分析',
    'teacher': '卫教授',
    'content_quality': 5,
    'clarity': 4,
    'homework': 3,
    'grading': 4,
    'comment': '测试评价1',
    'tags': ['干货多']
}, cid='unique_test_client_001')
print(f"  第一次提交: code={res1['code']}, message={res1['message']}")

res2 = post('/review/submit', {
    'semester': '2025-2026-2',
    'course_name': '算法设计与分析',
    'teacher': '卫教授',
    'content_quality': 4,
    'clarity': 3,
    'homework': 4,
    'grading': 5,
    'comment': '重复评价',
    'tags': ['给分好']
}, cid='unique_test_client_001')
print(f"  第二次提交: code={res2['code']}, message={res2['message']}")
assert res2['code'] == 1, f"期望重复提交被拒绝(code=1), 实际{res2['code']}"
assert '已经' in res2['message'] or '只能' in res2['message']
print("  ✅ 通过")

print("\n=== 测试5: 不同客户端可以评价同一门课 ===")
res3 = post('/review/submit', {
    'semester': '2025-2026-2',
    'course_name': '算法设计与分析',
    'teacher': '卫教授',
    'content_quality': 4,
    'clarity': 5,
    'homework': 3,
    'grading': 4,
    'comment': '不同客户端评价',
    'tags': ['干货多']
}, cid='unique_test_client_002')
print(f"  code={res3['code']}, message={res3['message']}")
assert res3['code'] == 0
print("  ✅ 通过")

print("\n=== 测试6: 管理员隐藏评价 ===")
review_id = res1['data']['review_id']
res = post('/admin/review/hide', {'review_id': review_id, 'reason': '测试隐藏违规内容'}, token=token)
print(f"  code={res['code']}, message={res['message']}")
assert res['code'] == 0
print("  ✅ 通过")

print("\n=== 测试7: 普通用户看不到被隐藏的评价 ===")
res = get('/course/detail/get', {'id': res1['data']['course_id']})
hidden_in_detail = [r for r in res['data']['reviews'] if r.get('hidden')]
print(f"  详情页隐藏评价数={len(hidden_in_detail)} (期望0)")
assert len(hidden_in_detail) == 0
print("  ✅ 通过")

print("\n=== 测试8: 管理员可以看到被隐藏的评价 ===")
res = get('/admin/review/list/get', token=token)
hidden = [r for r in res['data']['items'] if r.get('hidden') and r['id'] == review_id]
print(f"  管理面板隐藏评价数量={len(hidden)} (期望1)")
assert len(hidden) == 1
print(f"  隐藏原因={hidden[0]['hidden_reason']}")
print("  ✅ 通过")

print("\n=== 测试9: 管理员恢复评价 ===")
res = post('/admin/review/restore', {'review_id': review_id}, token=token)
print(f"  code={res['code']}, message={res['message']}")
assert res['code'] == 0
print("  ✅ 通过")

print("\n" + "=" * 50)
print("🎉 所有测试通过！修复验证完成！")
print("=" * 50)
