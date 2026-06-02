from typing import Dict, Any, List
from app.model.dafeiji_model import DafeijiAchievementModel, DafeijiUserAchievementModel


class DafeijiAchievementBusiness:
    def __init__(self):
        self.achievement_model = DafeijiAchievementModel()
        self.user_achievement_model = DafeijiUserAchievementModel()

    def get_all_achievements(self, page: int = 1, page_size: int = 10, category: str = None) -> Dict[str, Any]:
        result = self.achievement_model.get_all(page, page_size, category)
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
        achievements = self.user_achievement_model.get_all_with_status(user_id)
        result = []
        for a in achievements:
            item = self.achievement_model.to_dict(a)
            item['unlocked'] = bool(a.get('unlocked', 0))
            item['unlocked_at'] = a.get('unlocked_at')
            result.append(item)
        return {'code': 0, 'msg': 'success', 'data': result}

    def check_and_unlock(self, user_id: int, stats: Dict[str, Any]) -> Dict[str, Any]:
        all_achievements = self.achievement_model.get_all_list()
        unlocked_ids = self.user_achievement_model.get_user_achievement_ids(user_id)
        new_unlocks = []
        for achievement in all_achievements:
            if achievement.get('id') in unlocked_ids:
                continue
            condition_type = achievement.get('condition_type')
            condition_value = achievement.get('condition_value', 0)
            current_value = stats.get(condition_type, 0)
            if current_value >= condition_value:
                self.user_achievement_model.unlock(user_id, achievement.get('id'))
                new_unlocks.append(self.achievement_model.to_dict(achievement))
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'new_unlocks': new_unlocks,
                'total_unlocked': len(unlocked_ids) + len(new_unlocks)
            }
        }

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if not data.get('name'):
            return {'code': 1, 'msg': '成就名称不能为空', 'data': None}
        if not data.get('condition_type'):
            return {'code': 1, 'msg': '条件类型不能为空', 'data': None}
        achievement_id = self.achievement_model.create(data)
        if achievement_id > 0:
            achievement = self.achievement_model.get_by_id(achievement_id)
            return {'code': 0, 'msg': '创建成功', 'data': self.achievement_model.to_dict(achievement)}
        return {'code': 1, 'msg': '创建失败', 'data': None}

    def update(self, achievement_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        achievement = self.achievement_model.get_by_id(achievement_id)
        if not achievement:
            return {'code': 1, 'msg': '成就不存在', 'data': None}
        affected = self.achievement_model.update(achievement_id, data)
        if affected >= 0:
            updated = self.achievement_model.get_by_id(achievement_id)
            return {'code': 0, 'msg': '更新成功', 'data': self.achievement_model.to_dict(updated)}
        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete(self, achievement_id: int) -> Dict[str, Any]:
        achievement = self.achievement_model.get_by_id(achievement_id)
        if not achievement:
            return {'code': 1, 'msg': '成就不存在', 'data': None}
        affected = self.achievement_model.delete(achievement_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}
