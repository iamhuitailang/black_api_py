from typing import Dict, Any, List
from app.model.doudizhu_model import AchievementModel, UserAchievementModel, UserModel


class DoudizhuAchievementBusiness:
    def __init__(self):
        self.achievement_model = AchievementModel()
        self.user_achievement_model = UserAchievementModel()
        self.user_model = UserModel()

    def get_achievement_list(self, page: int = 1, page_size: int = 20, type: int = None) -> Dict[str, Any]:
        result = self.achievement_model.get_all(page, page_size, type)
        items = [self.achievement_model.to_dict(item) for item in result.get('items', [])]

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

    def get_user_achievements(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        unlocked = self.user_achievement_model.get_by_user_id(user_id)
        unlocked_ids = [ua.get('achievement_id') for ua in unlocked]

        all_achievements = self.achievement_model.query.find_all({'status': 1})

        result = []
        for achievement in all_achievements:
            ach_dict = self.achievement_model.to_dict(achievement)
            ach_dict['unlocked'] = achievement.get('id') in unlocked_ids
            if ach_dict['unlocked']:
                ua = next((u for u in unlocked if u.get('achievement_id') == achievement.get('id')), None)
                if ua:
                    ach_dict['unlocked_at'] = ua.get('unlocked_at')
            result.append(ach_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': result,
                'unlocked_count': len(unlocked),
                'total_count': len(all_achievements)
            }
        }

    def create_achievement(self, name: str, description: str = '', type: int = 0,
                           condition_value: int = 0, reward_coins: int = 0,
                           reward_exp: int = 0, icon: str = '') -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': '成就名称不能为空',
                'data': None
            }

        achievement_id = self.achievement_model.create(
            name=name,
            description=description,
            type=type,
            condition_value=condition_value,
            reward_coins=reward_coins,
            reward_exp=reward_exp,
            icon=icon
        )

        if achievement_id > 0:
            achievement = self.achievement_model.get_by_id(achievement_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.achievement_model.to_dict(achievement)
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

        affected = self.achievement_model.update(achievement_id, data)
        if affected >= 0:
            updated = self.achievement_model.get_by_id(achievement_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.achievement_model.to_dict(updated)
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

    def get_achievement_detail(self, achievement_id: int) -> Dict[str, Any]:
        achievement = self.achievement_model.get_by_id(achievement_id)
        if not achievement:
            return {
                'code': 1,
                'msg': '成就不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.achievement_model.to_dict(achievement)
        }
