import urllib.request
import json

BASE = 'http://localhost:8001/api'

def get(path, params=None):
    url = BASE + path
    if params:
        from urllib.parse import urlencode
        url += '?' + urlencode({k: v for k, v in params.items() if v})
    req = urllib.request.Request(url, headers={'X-Client-ID': 'test_user'})
    return json.loads(urllib.request.urlopen(req).read())

def post(path, data, cid='test_user'):
    payload = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(BASE + path, data=payload,
        headers={'Content-Type': 'application/json', 'X-Client-ID': cid})
    return json.loads(urllib.request.urlopen(req).read())

print("=== 1. 学期列表 ===")
res = get('/course/filter/options/get')
print(json.dumps(res, ensure_ascii=False, indent=2))

print("\n=== 2. 教师列表 ===")
res = get('/course/teachers/get', {'semester': '2025-2026-1'})
print(json.dumps(res, ensure_ascii=False, indent=2))

print("\n=== 3. 提交评价1 ===")
res = post('/review/submit', {
    'semester': '2025-2026-1',
    'course_name': '高等数学',
    'teacher': '张教授',
    'content_quality': 5,
    'clarity': 4,
    'homework': 3,
    'grading': 4,
    'comment': '老师讲得很好，内容充实！',
    'tags': ['干货多', '给分好']
}, 'user1')
print(json.dumps(res, ensure_ascii=False, indent=2))

print("\n=== 4. 提交更多评价凑数 ===")
for i in range(6):
    res = post('/review/submit', {
        'semester': '2025-2026-1',
        'course_name': '高等数学',
        'teacher': '张教授',
        'content_quality': 4 + (i % 2),
        'clarity': 3 + (i % 2),
        'homework': 3,
        'grading': 4,
        'comment': f'评价{i+1}',
        'tags': ['干货多'] if i % 2 == 0 else ['作业多']
    }, f'user{i+2}')
    print(f"  评价{i+1}: {res['message']}")

print("\n=== 5. 课程详情 ===")
res = get('/course/detail/get', {'id': 1})
print('课程名:', res['data']['course']['name'])
print('综合评分:', res['data']['scores'])
print('标签频率:', res['data']['tags_frequency'])
print('评价数:', len(res['data']['reviews']))
if res['data']['reviews']:
    print('第一条评价:', json.dumps(res['data']['reviews'][0], ensure_ascii=False))

print("\n=== 6. 点赞 ===")
rid = res['data']['reviews'][0]['id']
res = post('/review/upvote', {'review_id': rid}, 'voter1')
print(f'点赞结果: {res["message"]}')

print("\n=== 7. 重复点赞（应该失败）===")
res = post('/review/upvote', {'review_id': rid}, 'voter1')
print(f'重复点赞: {res["message"]}')

print("\n=== 8. 排行榜 ===")
res = get('/ranking/list/get', {'semester': '2025-2026-1', 'min_reviews': 5})
print('好评榜TOP:', [(r['name'], r['avg_score']) for r in res['data']['good']])
print('避雷榜TOP:', [(r['name'], r['avg_score']) for r in res['data']['bad']])

print("\n=== 9. 管理员隐藏评价 ===")
res = post('/admin/review/hide', {'review_id': rid, 'reason': '测试违规内容'})
print(f'隐藏结果: {res["message"]}')

print("\n=== 10. 验证隐藏后详情 ===")
res = get('/course/detail/get', {'id': 1})
hidden = [r for r in res['data']['reviews'] if r.get('hidden')]
print(f'隐藏评价数: {len(hidden)}')
if hidden:
    print(f'隐藏原因: {hidden[0]["hidden_reason"]}')

print("\n=== 11. 恢复评价 ===")
res = post('/admin/review/restore', {'review_id': rid})
print(f'恢复结果: {res["message"]}')

print("\n✅ 所有测试完成！")
