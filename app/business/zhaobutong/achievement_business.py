from typing import Dict, Any, List
from app.model.zhaobutong_model import ZbtAchievementModel, ZbtUserAchievementModel


class ZbtAchievementBusiness:
    def __init__(self):
        self.achievement_model = ZbtAchievementModel()
        self.user_achievement_model = ZbtUserAchievementModel()

    def get_all_achievements(self, user_id: int = None) -> Dict[str, Any]:
        if user_id:
            achievements = self.user_achievement_model.get_all_with_status(user_id)
        else:
            achievements = self.achievement_model.get_all_achievements()
        items = [self._format_achievement(a) for a in achievements]
        return {'code': 0, 'msg': 'success', 'data': items}

    def get_user_achievements(self, user_id: int) -> Dict[str, Any]:
        achievements = self.user_achievement_model.get_user_achievements(user_id)
        items = [self._format_achievement(a) for a in achievements]
        total = self.achievement_model.query.count()
        unlocked = len(items)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'achievements': items,
                'total': total,
                'unlocked': unlocked,
                'progress': round(unlocked / total * 100, 1) if total > 0 else 0
            }
        }

    def create_achievement(self, data: Dict[str, Any]) -> Dict[str, Any]:
        name = data.get('name', '')
        existing = self.achievement_model.get_by_name(name)
        if existing:
            return {'code': 1, 'msg': '成就名称已存在', 'data': None}

        ach_id = self.achievement_model.create(
            name=name,
            title=data.get('title', ''),
            description=data.get('description', ''),
            icon=data.get('icon', ''),
            type=data.get('type', 'special'),
            condition_value=data.get('condition_value', 0),
            sort_order=data.get('sort_order', 0)
        )
        if ach_id > 0:
            ach = self.achievement_model.get_by_id(ach_id)
            return {'code': 0, 'msg': '创建成功', 'data': self.achievement_model.to_dict(ach)}
        return {'code': 1, 'msg': '创建失败', 'data': None}

    def update_achievement(self, achievement_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        ach = self.achievement_model.get_by_id(achievement_id)
        if not ach:
            return {'code': 1, 'msg': '成就不存在', 'data': None}
        self.achievement_model.update(achievement_id, data)
        updated = self.achievement_model.get_by_id(achievement_id)
        return {'code': 0, 'msg': '更新成功', 'data': self.achievement_model.to_dict(updated)}

    def delete_achievement(self, achievement_id: int) -> Dict[str, Any]:
        ach = self.achievement_model.get_by_id(achievement_id)
        if not ach:
            return {'code': 1, 'msg': '成就不存在', 'data': None}
        self.achievement_model.delete(achievement_id)
        return {'code': 0, 'msg': '删除成功', 'data': None}

    def _format_achievement(self, ach: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': ach.get('id'),
            'name': ach.get('name'),
            'title': ach.get('title'),
            'description': ach.get('description'),
            'icon': ach.get('icon'),
            'type': ach.get('type'),
            'condition_value': ach.get('condition_value'),
            'sort_order': ach.get('sort_order'),
            'unlocked': bool(ach.get('unlocked', 0)),
            'unlocked_at': ach.get('unlocked_at')
        }
