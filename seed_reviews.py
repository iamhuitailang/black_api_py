import urllib.request, json, random

BASE = 'http://localhost:8001/api'

def post(path, data, cid='test_user'):
    payload = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(BASE + path, data=payload,
        headers={'Content-Type': 'application/json', 'X-Client-ID': cid})
    return json.loads(urllib.request.urlopen(req).read())

def get(path, params=None):
    url = BASE + path
    if params:
        from urllib.parse import urlencode
        url += '?' + urlencode({k: v for k, v in params.items() if v})
    req = urllib.request.Request(url, headers={'X-Client-ID': 'test_user'})
    return json.loads(urllib.request.urlopen(req).read())

# 获取课程列表
res = get('/course/list/get', {'semester': '2025-2026-1'})
courses = res['data']['items']
print(f"共有 {len(courses)} 门课程")

good_courses = [
    ('大学英语', '吴教授'),
    ('软件工程', '孙教授'),
    ('概率论与数理统计', '王教授'),
]
bad_courses = [
    ('大学物理', '周教授'),
    ('线性代数', '李教授'),
    ('思想政治', '郑教授'),
]

uid = 100
for name, teacher in good_courses:
    for i in range(7):
        uid += 1
        post('/review/submit', {
            'semester': '2025-2026-1',
            'course_name': name,
            'teacher': teacher,
            'content_quality': random.randint(4, 5),
            'clarity': random.randint(4, 5),
            'homework': random.randint(3, 5),
            'grading': random.randint(4, 5),
            'comment': f'好评课程{name} - {i}',
            'tags': ['干货多', '给分好'] if random.random() > 0.5 else ['干货多']
        }, f'guser_{uid}')
    print(f'好评 {name} 完成')

for name, teacher in bad_courses:
    for i in range(7):
        uid += 1
        post('/review/submit', {
            'semester': '2025-2026-1',
            'course_name': name,
            'teacher': teacher,
            'content_quality': random.randint(1, 3),
            'clarity': random.randint(1, 3),
            'homework': random.randint(1, 3),
            'grading': random.randint(1, 3),
            'comment': f'差评课程{name} - {i}',
            'tags': ['PPT念稿', '作业多'] if random.random() > 0.5 else ['点名频繁']
        }, f'buser_{uid}')
    print(f'差评 {name} 完成')

print("所有测试评价添加完成！")
