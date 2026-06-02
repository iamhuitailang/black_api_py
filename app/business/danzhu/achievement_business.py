from typing import Dict, Any, List
from app.model.danzhu_model import AchievementModel, UserAchievementModel


class DanzhuAchievementBusiness:
    def __init__(self):
        self.achievement_model = AchievementModel()
        self.user_achievement_model = UserAchievementModel()

    def get_all_achievements(self) -> Dict[str, Any]:
        achievements = self.achievement_model.get_all_active()
        items = [self.achievement_model.to_dict(a) for a in achievements]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_user_achievements(self, user_id: int) -> Dict[str, Any]:
        all_achievements = self.achievement_model.get_all_active()
        user_achievement_ids = self.user_achievement_model.get_user_achievement_ids(user_id)
        user_achievements = self.user_achievement_model.get_user_achievements(user_id)

        total_rewards = self.user_achievement_model.get_user_total_rewards(user_id)

        unlocked_ids = set(user_achievement_ids)
        all_items = []
        for achievement in all_achievements:
            item = self.achievement_model.to_dict(achievement)
            item['unlocked'] = achievement.get('id') in unlocked_ids
            if item['unlocked']:
                for ua in user_achievements:
                    if ua.get('achievement_id') == achievement.get('id'):
                        item['unlocked_at'] = ua.get('created_at')
                        break
            all_items.append(item)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': all_items,
                'total_count': len(all_items),
                'unlocked_count': len(unlocked_ids),
                'total_rewards': total_rewards
            }
        }

    def get_achievement_list(self, page: int = 1, page_size: int = 10,
                             type: str = None, status: int = None,
                             keyword: str = None) -> Dict[str, Any]:
        result = self.achievement_model.get_all(page, page_size, type, status, keyword)
        items = [self.achievement_model.to_dict(a) for a in result.get('items', [])]

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

    def create_achievement(self, name: str, description: str = '', type: str = 'score',
                           icon: str = '', condition_type: str = '', condition_value: int = 0,
                           reward_points: int = 0, status: int = 0) -> Dict[str, Any]:
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
            icon=icon,
            condition_type=condition_type,
            condition_value=condition_value,
            reward_points=reward_points,
            status=status
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
            updated_achievement = self.achievement_model.get_by_id(achievement_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.achievement_model.to_dict(updated_achievement)
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
