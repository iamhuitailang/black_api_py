from typing import Dict, Any, List, Optional
import random
from app.model.maomi_model import ActivityModel, CatModel, UserProfileModel, GameRecordModel


class ActivityBusiness:
    def __init__(self):
        self.model = ActivityModel()
        self.cat_model = CatModel()
        self.user_profile_model = UserProfileModel()
        self.record_model = GameRecordModel()

    def get_all_activities(self, user_id: int) -> Dict[str, Any]:
        try:
            activities = self.model.get_by_user_id(user_id)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': activities,
                    'count': len(activities)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_active_activities(self, user_id: int) -> Dict[str, Any]:
        try:
            activities = self.model.get_active(user_id)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': activities,
                    'count': len(activities)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_upcoming_activities(self, user_id: int) -> Dict[str, Any]:
        try:
            activities = self.model.get_upcoming(user_id)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': activities,
                    'count': len(activities)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_activity(self, activity_id: int) -> Dict[str, Any]:
        activity = self.model.get_by_id(activity_id)
        if activity:
            return {
                'code': 0,
                'message': 'success',
                'data': activity
            }
        return {
            'code': 1,
            'message': '活动不存在',
            'data': None
        }

    def add_activity(self, user_id: int, name: str, type: str, description: str = '',
                   reward_coins: int = 0, reward_experience: int = 0,
                   duration_minutes: int = 60, max_participants: int = 10) -> Dict[str, Any]:
        try:
            activity_id = self.model.create(
                user_id=user_id,
                name=name,
                type=type,
                description=description,
                reward_coins=reward_coins,
                reward_experience=reward_experience,
                duration_minutes=duration_minutes,
                max_participants=max_participants
            )
            return self.get_activity(activity_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def start_activity(self, user_id: int, activity_id: int) -> Dict[str, Any]:
        activity = self.model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'message': '活动不存在',
                'data': None
            }
        if activity.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '无权限操作此活动',
                'data': None
            }
        if activity.get('status') != 'upcoming':
            return {
                'code': 1,
                'message': '活动状态不正确',
                'data': None
            }
        try:
            activity = self.model.start_activity(activity_id)
            if activity:
                return {
                    'code': 0,
                    'message': '活动开始',
                    'data': activity
                }
            return {
                'code': 1,
                'message': '开始失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def end_activity(self, user_id: int, activity_id: int) -> Dict[str, Any]:
        activity = self.model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'message': '活动不存在',
                'data': None
            }
        if activity.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '无权限操作此活动',
                'data': None
            }
        if activity.get('status') != 'active':
            return {
                'code': 1,
                'message': '活动状态不正确',
                'data': None
            }

        cats = self.cat_model.get_all_active(user_id)
        if not cats:
            winner = random.choice(cats)
            cat_winner_id = winner.get('id')
            cat_winner_name = winner.get('name')
        else:
            cat_winner_id = 0
            cat_winner_name = ''

        try:
            activity = self.model.end_activity(activity_id, cat_winner_id, cat_winner_name)

            reward_coins = activity.get('reward_coins', 0)
            reward_experience = activity.get('reward_experience', 0)

            if reward_coins > 0:
                self.user_profile_model.add_coins(user_id, reward_coins)
            if reward_experience > 0:
                self.user_profile_model.add_experience(user_id, reward_experience)

            self.record_model.add_activity_record(user_id, activity.get('name', ''),
                                        reward_coins, reward_experience)

            return {
                'code': 0,
                'message': '活动结束',
                'data': {
                    'activity': activity,
                    'winner_cat': cat_winner_name,
                    'reward_coins': reward_coins,
                    'reward_experience': reward_experience
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def add_participant(self, user_id: int, activity_id: int) -> Dict[str, Any]:
        activity = self.model.add_participant(activity_id)
        if activity:
            return {
                'code': 0,
                'message': '报名成功',
                'data': activity
            }
        return {
            'code': 1,
            'message': '活动已满或不存在',
            'data': None
        }

    def delete_activity(self, user_id: int, activity_id: int) -> Dict[str, Any]:
        activity = self.model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'message': '活动不存在',
                'data': None
            }
        if activity.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '无权限操作此活动',
                'data': None
            }
        try:
            affected = self.model.delete(activity_id)
            if affected > 0:
                return {
                    'code': 0,
                    'message': '删除成功',
                    'data': None
                }
            return {
                'code': 1,
                'message': '删除失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def create_default_activities(self, user_id: int) -> Dict[str, Any]:
        try:
            count = self.model.create_default_activities(user_id)
            return {
                'code': 0,
                'message': f'成功创建{count}个默认活动',
                'data': {
                    'count': count
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
