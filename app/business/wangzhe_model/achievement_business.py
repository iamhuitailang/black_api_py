from typing import Dict, Any, Optional, List
from app.model.wangzhe_model import AchievementModel, UserAchievementModel, UserModel


class WangzheAchievementBusiness:
    def __init__(self):
        self.achievement_model = AchievementModel()
        self.user_achievement_model = UserAchievementModel()
        self.user_model = UserModel()

    def get_achievement_list(self, page: int = 1, page_size: int = 50, 
                            type: str = None) -> Dict[str, Any]:
        result = self.achievement_model.get_all(page, page_size, type, status=0)
        items = [self.achievement_model.to_public_dict(item) for item in result.get('items', [])]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_user_achievement_list(self, user_id: int) -> Dict[str, Any]:
        achievements = self.achievement_model.get_all(page=1, page_size=100, status=0).get('items', [])
        user_achievements = self.user_achievement_model.get_by_user_id(user_id)

        result = []
        for achievement in achievements:
            user_ach = next((ua for ua in user_achievements if ua.get('achievement_id') == achievement.get('id')), None)
            
            ach_dict = self.achievement_model.to_public_dict(achievement)
            if user_ach:
                ach_dict['current_value'] = user_ach.get('current_value', 0)
                ach_dict['completed'] = user_ach.get('completed', 0)
                ach_dict['claimed'] = user_ach.get('claimed', 0)
                ach_dict['completed_at'] = user_ach.get('completed_at')
                ach_dict['progress'] = min(100, int(user_ach.get('current_value', 0) / achievement.get('target_value', 1) * 100))
            else:
                ach_dict['current_value'] = 0
                ach_dict['completed'] = 0
                ach_dict['claimed'] = 0
                ach_dict['completed_at'] = None
                ach_dict['progress'] = 0

            result.append(ach_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def claim_achievement(self, user_id: int, achievement_id: int) -> Dict[str, Any]:
        user_ach = self.user_achievement_model.get_by_user_and_achievement(user_id, achievement_id)
        if not user_ach or user_ach.get('completed') != 1:
            return {
                'code': 1,
                'msg': '成就未完成',
                'data': None
            }

        if user_ach.get('claimed') == 1:
            return {
                'code': 1,
                'msg': '奖励已领取',
                'data': None
            }

        achievement = self.achievement_model.get_by_id(achievement_id)
        if not achievement:
            return {
                'code': 1,
                'msg': '成就不存在',
                'data': None
            }

        self.user_achievement_model.claim_reward(user_ach.get('id'))

        reward_gold = achievement.get('reward_gold', 0)
        reward_diamonds = achievement.get('reward_diamonds', 0)
        reward_exp = achievement.get('reward_experience', 0)

        if reward_gold > 0:
            self.user_model.update_gold(user_id, reward_gold)
        if reward_exp > 0:
            self.user_model.add_experience(user_id, reward_exp)

        return {
            'code': 0,
            'msg': '领取成功',
            'data': {
                'gold': reward_gold,
                'diamonds': reward_diamonds,
                'experience': reward_exp
            }
        }

    def get_unclaimed_count(self, user_id: int) -> Dict[str, Any]:
        count = self.user_achievement_model.get_unclaimed_count(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'count': count
            }
        }

    def create_achievement(self, **kwargs) -> Dict[str, Any]:
        name = kwargs.get('name')
        if not name:
            return {
                'code': 1,
                'msg': '成就名称不能为空',
                'data': None
            }

        existing = self.achievement_model.get_by_name(name)
        if existing:
            return {
                'code': 1,
                'msg': '该成就名称已存在',
                'data': None
            }

        achievement_id = self.achievement_model.create(**kwargs)
        if achievement_id > 0:
            achievement = self.achievement_model.get_by_id(achievement_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.achievement_model.to_public_dict(achievement)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_achievement(self, achievement_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        achievement = self.achievement_model.get_by_id(achievement_id)
        if not achievement:
            return {
                'code': 1,
                'msg': '成就不存在',
                'data': None
            }

        name = data.get('name')
        if name and name != achievement.get('name'):
            existing = self.achievement_model.get_by_name(name)
            if existing:
                return {
                    'code': 1,
                    'msg': '该成就名称已存在',
                    'data': None
                }

        affected = self.achievement_model.update(achievement_id, data)
        if affected > 0:
            updated_achievement = self.achievement_model.get_by_id(achievement_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.achievement_model.to_public_dict(updated_achievement)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_achievement(self, achievement_id: int) -> Dict[str, Any]:
        achievement = self.achievement_model.get_by_id(achievement_id)
        if not achievement:
            return {
                'code': 1,
                'msg': '成就不存在',
                'data': None
            }

        affected = self.achievement_model.delete(achievement_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }

    def get_admin_achievement_list(self, page: int = 1, page_size: int = 50, 
                                   type: str = None, status: int = None) -> Dict[str, Any]:
        result = self.achievement_model.get_all(page, page_size, type, status)
        items = [self.achievement_model.to_public_dict(item) for item in result.get('items', [])]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }
