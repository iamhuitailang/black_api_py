#!/usr/bin/env python3
import sys
import os
from datetime import datetime, timedelta
import random

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.model.biaoqing_model import (
    UserModel,
    CategoryModel,
    EmojiModel,
    TagModel,
    EmojiTagModel,
    ActivityModel,
    AdminModel,
)

from app.common.sqlite.db import get_db

EMOJI_TEST_DATA = [
    {'title': '笑哭了', 'url': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&h=300&fit=crop', 'category_id': 1, 'tags': ['搞笑', '笑哭', '开心'], 'is_hot': 1, 'is_recommend': 1},
    {'title': '可爱猫咪', 'url': 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=300&h=300&fit=crop', 'category_id': 6, 'tags': ['可爱', '猫咪', '萌'], 'is_hot': 1, 'is_recommend': 1},
    {'title': '生气的小狗', 'url': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&h=300&fit=crop', 'category_id': 7, 'tags': ['狗狗', '可爱'], 'is_hot': 1},
    {'title': '沙雕表情', 'url': 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=300&h=300&fit=crop', 'category_id': 5, 'tags': ['斗图', '沙雕'], 'is_recommend': 1},
    {'title': '卖萌表情', 'url': 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=300&h=300&fit=crop', 'category_id': 2, 'tags': ['可爱', '卖萌', '么么哒'], 'is_hot': 1, 'is_recommend': 1},
    {'title': '怼人表情', 'url': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop', 'category_id': 3, 'tags': ['怼人', '斗图'], 'is_recommend': 1},
    {'title': '撩妹表情', 'url': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=300&fit=crop', 'category_id': 4, 'tags': ['撩妹', '搞怪'], 'is_hot': 1},
    {'title': '动漫表情', 'url': 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&h=300&fit=crop', 'category_id': 8, 'tags': ['动漫', '二次元'], 'is_recommend': 1},
    {'title': '明星表情', 'url': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop', 'category_id': 9, 'tags': ['明星', '搞怪'], 'is_hot': 1},
    {'title': '搞笑熊猫头', 'url': 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=300&fit=crop', 'category_id': 5, 'tags': ['斗图', '熊猫头'], 'is_recommend': 1},
    {'title': '可爱企鹅', 'url': 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=300&h=300&fit=crop', 'category_id': 10, 'tags': ['企鹅', '可爱'], 'is_hot': 1},
    {'title': '搞笑表情', 'url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop', 'category_id': 1, 'tags': ['搞笑', '哈哈'], 'is_recommend': 1},
    {'title': '猫咪表情包', 'url': 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=300&h=300&fit=crop', 'category_id': 6, 'tags': ['猫咪', '可爱', '搞怪'], 'is_hot': 1},
    {'title': '沙雕网友', 'url': 'https://images.unsplash.com/photo-1527980965255-d3b416303d1?w=300&h=300&fit=crop', 'category_id': 5, 'tags': ['沙雕', '搞笑'], 'is_recommend': 1},
    {'title': '生气表情', 'url': 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&h=300&fit=crop', 'category_id': 3, 'tags': ['生气', '怼人'], 'is_hot': 1},
    {'title': '微笑表情', 'url': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop', 'category_id': 4, 'tags': ['微笑', '撩妹'], 'is_recommend': 1},
]

ACTIVITY_TEST_DATA = [
    {
        'title': '夏日表情包大赛',
        'description': '上传你最喜欢的夏日主题表情包，赢取丰厚奖励！',
        'cover_image': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=300&fit=crop',
        'content': '🎁 一等奖：500积分，二等奖：300积分',
        'status': ActivityModel.STATUS_ACTIVE,
        'start_time': (datetime.now() - timedelta(days=7)).isoformat(),
        'end_time': (datetime.now() + timedelta(days=30)).isoformat(),
        'points_reward': 100,
        'max_participants': 1000,
    },
    {
        'title': '萌宠表情包征集',
        'description': '分享你家萌宠的搞笑瞬间，让大家一起开心！',
        'cover_image': 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&h=300&fit=crop',
        'content': '🏆 优秀作品将获得首页推荐位',
        'status': ActivityModel.STATUS_ACTIVE,
        'start_time': (datetime.now() - timedelta(days=3)).isoformat(),
        'end_time': (datetime.now() + timedelta(days=20)).isoformat(),
        'points_reward': 50,
        'max_participants': 500,
    },
    {
        'title': '情人节表情包收集',
        'description': '最甜情人节表情包，等你来参加！',
        'cover_image': 'https://images.unsplash.com/photo-1518199266791-5375a8f9eee?w=600&h=300&fit=crop',
        'content': '❤️ 参与即得 20积分奖励',
        'status': ActivityModel.STATUS_ENDED,
        'start_time': (datetime.now() - timedelta(days=20)).isoformat(),
        'end_time': (datetime.now() - timedelta(days=5)).isoformat(),
        'points_reward': 20,
        'max_participants': 2000,
    },
]

def create_test_users():
    user_model = UserModel()
    users = []
    
    test_users = [
        {'username': 'testuser', 'password': '123456', 'email': 'test@example.com', 'nickname': '测试用户'},
        {'username': 'xiaoming', 'password': '123456', 'email': 'xiaoming@example.com', 'nickname': '小明'},
        {'username': 'xiaohong', 'password': '123456', 'email': 'xiaohong@example.com', 'nickname': '小红'},
    ]
    
    for user_data in test_users:
        existing = user_model.get_by_username(user_data['username'])
        if not existing:
            user_id = user_model.create(
                username=user_data['username'],
                email=user_data['email'],
                password=user_data['password'],
                nickname=user_data['nickname']
            )
            if user_id > 0:
                new_user = user_model.get_by_id(user_id)
                users.append(new_user)
                print(f"  ✅ 创建用户: {user_data['username']}")
        else:
            users.append(existing)
            print(f"  ℹ️ 用户已存在: {user_data['username']}")
    
    return users

def create_test_emojis(users):
    emoji_model = EmojiModel()
    tag_model = TagModel()
    emoji_tag_model = EmojiTagModel()
    
    for i, emoji_data in enumerate(EMOJI_TEST_DATA):
        user_id = users[i % len(users)]['id'] if users else 1
        emoji_id = emoji_model.create(
            url=emoji_data['url'],
            category_id=emoji_data['category_id'],
            user_id=user_id,
            title=emoji_data['title'],
            description=f'{emoji_data["title"]}的描述...',
            width=300,
            height=300,
            file_size=random.randint(10000, 100000),
            file_type='image/jpeg',
            status=EmojiModel.STATUS_APPROVED
        )
        
        if emoji_id > 0:
            # 设置热门和推荐
            emoji_model.update(emoji_id, {
                'is_hot': emoji_data.get('is_hot', 0),
                'is_recommend': emoji_data.get('is_recommend', 0),
                'view_count': random.randint(100, 5000),
                'download_count': random.randint(10, 500),
                'favorite_count': random.randint(5, 200),
            })
            
            # 创建标签
            for tag_name in emoji_data['tags']:
                tag_id = tag_model.get_or_create(tag_name)
                if tag_id > 0:
                    emoji_tag_model.create(emoji_id, tag_id)
            
            print(f"  ✅ 创建表情包: {emoji_data['title']}")

def create_test_activities():
    activity_model = ActivityModel()
    
    for activity_data in ACTIVITY_TEST_DATA:
        # 检查是否已存在
        existing = activity_model.query.find_one({'title': activity_data['title']})
        if not existing:
            activity_id = activity_model.create(
                title=activity_data['title'],
                description=activity_data['description'],
                cover_image=activity_data['cover_image'],
                content=activity_data['content'],
                start_time=activity_data['start_time'],
                end_time=activity_data['end_time'],
                points_reward=activity_data['points_reward'],
                max_participants=activity_data['max_participants'],
                created_by=1
            )
            if activity_id > 0:
                # 更新状态和参与人数
                activity_model.update(activity_id, {
                    'status': activity_data['status'],
                    'current_participants': random.randint(50, 500)
                })
                print(f"  ✅ 创建活动: {activity_data['title']}")
        else:
            print(f"  ℹ️ 活动已存在: {activity_data['title']}")

def main():
    print("=" * 60)
    print("表情包网站测试数据初始化")
    print("=" * 60)
    print()
    
    print("📋 步骤 1/3: 创建测试用户...")
    users = create_test_users()
    print()
    
    print("🖼️  步骤 2/3: 创建测试表情包...")
    create_test_emojis(users)
    print()
    
    print("🎉 步骤 3/3: 创建测试活动...")
    create_test_activities()
    print()
    
    print("=" * 60)
    print("✅ 测试数据初始化完成！")
    print("=" * 60)
    print()
    print("测试账号：")
    print("  用户名: testuser / 密码: 123456")
    print("  用户名: xiaoming / 密码: 123456")
    print("  管理员账号: admin / admin123")
    print()

if __name__ == "__main__":
    main()
