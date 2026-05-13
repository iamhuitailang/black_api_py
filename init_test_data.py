#!/usr/bin/env python3
"""
初始化活动报名系统测试数据
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
from app.model.bm.user import UserModel
from app.model.bm.activity import ActivityModel
from app.model.bm.registration import RegistrationModel
from app.model.bm.admin_token import AdminTokenModel
from app.model.bm.user_token import UserTokenModel


def init_test_data():
    print("=" * 50)
    print("开始初始化测试数据...")
    print("=" * 50)

    try:
        UserModel.init_default_admin()
        print("✓ 管理员账号已初始化: admin/admin123654")
    except Exception as e:
        print(f"✗ 管理员账号初始化失败: {e}")

    now = datetime.now()
    activity_model = ActivityModel()

    activities_data = [
        {
            "title": "2024年夏季技术分享大会",
            "description": "邀请业内顶尖技术专家，分享最新技术趋势和实战经验。涵盖人工智能、云计算、大数据等热门话题。",
            "cover_image": "",
            "location": "北京市朝阳区国际会议中心",
            "start_time": (now + timedelta(days=30)).isoformat(),
            "end_time": (now + timedelta(days=30, hours=8)).isoformat(),
            "registration_start": now.isoformat(),
            "registration_end": (now + timedelta(days=25)).isoformat(),
            "total_quota": 100,
            "need_approval": 0,
            "created_by": 1,
            "status": 1
        },
        {
            "title": "创业者沙龙第15期",
            "description": "与成功创业者面对面交流，分享创业经验和心得，探讨商业模式和融资策略。",
            "cover_image": "",
            "location": "上海市浦东新区创业孵化基地",
            "start_time": (now + timedelta(days=15)).isoformat(),
            "end_time": (now + timedelta(days=15, hours=4)).isoformat(),
            "registration_start": (now - timedelta(days=5)).isoformat(),
            "registration_end": (now + timedelta(days=10)).isoformat(),
            "total_quota": 50,
            "need_approval": 1,
            "created_by": 1,
            "status": 1
        },
        {
            "title": "Python编程进阶培训",
            "description": "从入门到精通，系统学习Python编程。包含实战项目演练，适合有一定编程基础的学员。",
            "cover_image": "",
            "location": "线上直播",
            "start_time": (now + timedelta(days=7)).isoformat(),
            "end_time": (now + timedelta(days=7, hours=6)).isoformat(),
            "registration_start": (now - timedelta(days=10)).isoformat(),
            "registration_end": (now + timedelta(days=5)).isoformat(),
            "total_quota": 200,
            "need_approval": 0,
            "created_by": 1,
            "status": 1
        },
        {
            "title": "年度产品经理大会",
            "description": "汇聚行业顶尖产品经理，分享产品方法论和成功案例，探讨AI时代产品发展趋势。",
            "cover_image": "",
            "location": "深圳市南山区科技园区",
            "start_time": (now + timedelta(days=45)).isoformat(),
            "end_time": (now + timedelta(days=46)).isoformat(),
            "registration_start": (now + timedelta(days=10)).isoformat(),
            "registration_end": (now + timedelta(days=40)).isoformat(),
            "total_quota": 300,
            "need_approval": 1,
            "created_by": 1,
            "status": 1
        },
        {
            "title": "春季户外拓展活动",
            "description": "团队户外拓展训练，增强团队凝聚力，释放工作压力。包含多个趣味团建项目。",
            "cover_image": "",
            "location": "杭州市西湖区拓展基地",
            "start_time": (now - timedelta(days=3)).isoformat(),
            "end_time": (now - timedelta(days=2)).isoformat(),
            "registration_start": (now - timedelta(days=20)).isoformat(),
            "registration_end": (now - timedelta(days=5)).isoformat(),
            "total_quota": 80,
            "need_approval": 0,
            "created_by": 1,
            "status": 3
        }
    ]

    for act_data in activities_data:
        try:
            status = act_data.pop('status')
            result_id = activity_model.create(**act_data)
            if status != 1:
                activity_model.update_status(result_id, status)
            print(f"✓ 创建活动: {act_data['title']}")
        except Exception as e:
            print(f"✗ 创建活动失败 [{act_data['title']}]: {e}")

    user_model = UserModel()
    test_users = [
        {
            "username": "zhangsan",
            "password": "123456",
            "nickname": "张三",
            "real_name": "张三",
            "phone": "13800138001",
            "email": "zhangsan@example.com",
            "role": "user"
        },
        {
            "username": "lisi",
            "password": "123456",
            "nickname": "李四",
            "real_name": "李四",
            "phone": "13800138002",
            "email": "lisi@example.com",
            "role": "user"
        },
        {
            "username": "wangwu",
            "password": "123456",
            "nickname": "王五",
            "real_name": "王五",
            "phone": "13800138003",
            "email": "wangwu@example.com",
            "role": "user"
        }
    ]

    for user_data in test_users:
        try:
            result = user_model.create(**user_data)
            print(f"✓ 创建测试用户: {user_data['nickname']} ({user_data['phone']}/123456)")
        except Exception as e:
            print(f"✗ 创建用户失败 [{user_data['nickname']}]: {e}")

    print("=" * 50)
    print("测试数据初始化完成！")
    print("=" * 50)
    print()
    print("【管理端登录信息】")
    print("  账号: admin")
    print("  密码: admin123654")
    print("  地址: /static/bm_admin/login.html")
    print()
    print("【测试用户账号（3个）】")
    print("  13800138001 / 123456 (张三)")
    print("  13800138002 / 123456 (李四)")
    print("  13800138003 / 123456 (王五)")
    print("  用户端地址: /static/bm_web/index.html")
    print()


if __name__ == "__main__":
    init_test_data()
