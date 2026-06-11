import urllib.request
import json

BASE_URL = 'http://localhost:8001/api'

def api_post(path, data):
    req = urllib.request.Request(
        f'{BASE_URL}{path}',
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def api_get(path):
    with urllib.request.urlopen(f'{BASE_URL}{path}') as resp:
        return json.loads(resp.read())

print("=== 创建项目 ===")
project = api_post('/project/create', {
    'name': '产品研发项目',
    'description': '公司核心产品的研发和迭代'
})
print(f"项目ID: {project['data']['id']}")
project_id = project['data']['id']

print("\n=== 创建会议1 ===")
meeting1 = api_post('/meeting/create', {
    'project_id': project_id,
    'title': '产品需求评审会',
    'date': '2026-06-10',
    'attendees': ['张三', '李四', '王五'],
    'content': '# 产品需求评审\n\n## 议题一：新版本功能规划\n\n讨论了 Q3 版本的功能规划，主要包括：\n\n- 用户中心改版\n- 数据报表优化\n- 移动端适配\n\n## 议题二：技术方案\n\n技术团队提出了新的架构方案，需要进一步评估。',
    'action_items': [
        {
            'content': '完成用户中心改版设计稿',
            'assignee': '张三',
            'due_date': '2026-06-15',
            'completed': False
        },
        {
            'content': '评估技术架构方案可行性',
            'assignee': '李四',
            'due_date': '2026-06-08',
            'completed': False
        },
        {
            'content': '整理需求文档',
            'assignee': '王五',
            'due_date': '2026-06-20',
            'completed': True
        }
    ]
})
print(f"会议ID: {meeting1['data']['id']}")

print("\n=== 创建会议2 ===")
meeting2 = api_post('/meeting/create', {
    'project_id': project_id,
    'title': '周例会',
    'date': '2026-06-09',
    'attendees': ['张三', '李四', '赵六', '钱七'],
    'content': '# 周例会\n\n## 上周工作回顾\n\n1. 用户模块开发完成 80%\n2. 数据看板进入测试阶段\n3. 接口文档更新完成\n\n## 本周计划\n\n- 完成用户模块剩余开发\n- 启动支付模块开发\n- 准备产品演示',
    'action_items': [
        {
            'content': '完成用户模块开发',
            'assignee': '李四',
            'due_date': '2026-06-12',
            'completed': False
        },
        {
            'content': '准备产品演示材料',
            'assignee': '赵六',
            'due_date': '2026-06-25',
            'completed': False
        }
    ]
})
print(f"会议ID: {meeting2['data']['id']}")

print("\n=== 创建会议3（无项目关联） ===")
meeting3 = api_post('/meeting/create', {
    'project_id': 0,
    'title': '新员工入职培训',
    'date': '2026-06-05',
    'attendees': ['钱七', '孙八'],
    'content': '# 新员工入职培训\n\n## 公司介绍\n\n- 公司发展历程\n- 组织架构\n- 企业文化\n\n## 规章制度\n\n- 考勤制度\n- 请假流程\n- 报销流程',
    'action_items': [
        {
            'content': '发放员工手册',
            'assignee': '钱七',
            'due_date': '2026-06-06',
            'completed': True
        }
    ]
})
print(f"会议ID: {meeting3['data']['id']}")

print("\n=== 验证：获取会议列表 ===")
meetings = api_get('/meeting/list')
print(f"总数: {meetings['data']['total']}")

print("\n=== 验证：获取待办列表 ===")
actions = api_get('/action/list')
print(f"待办总数: {len(actions['data'])}")

print("\n=== 验证：获取项目统计 ===")
stats = api_get('/stats/project')
print(f"项目数: {len(stats['data'])}")
if stats['data']:
    print(f"第一个项目会议数: {stats['data'][0]['meeting_count']}")

print("\n✅ 测试数据创建完成！")
