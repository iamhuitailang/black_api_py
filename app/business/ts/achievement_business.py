from typing import Dict, Any, List, Optional
from app.model.ts import TsAchievementModel, TsUserAchievementModel, TsUserModel, TsRecordModel


class TsAchievementBusiness:
    def __init__(self):
        self.achievement_model = TsAchievementModel()
        self.user_achievement_model = TsUserAchievementModel()
        self.user_model = TsUserModel()
        self.record_model = TsRecordModel()

    def get_all_achievements(self) -> Dict[str, Any]:
        achievements = self.achievement_model.get_all()

        return {
            'code': 0,
            'msg': 'success',
            'data': [self.achievement_model.to_dict(a) for a in achievements]
        }

    def get_achievements_by_type(self, condition_type: str) -> Dict[str, Any]:
        achievements = self.achievement_model.get_by_type(condition_type)

        return {
            'code': 0,
            'msg': 'success',
            'data': [self.achievement_model.to_dict(a) for a in achievements]
        }

    def get_user_achievements(self, user_id: int) -> Dict[str, Any]:
        user_achievements = self.user_achievement_model.get_by_user(user_id)

        formatted_achievements = []
        for ua in user_achievements:
            formatted_achievements.append({
                'id': ua.get('id'),
                'achievement_id': ua.get('achievement_id'),
                'name': ua.get('name'),
                'description': ua.get('description'),
                'condition_type': ua.get('condition_type'),
                'condition_value': ua.get('condition_value'),
                'badge_icon': ua.get('badge_icon'),
                'unlocked_at': ua.get('unlocked_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': formatted_achievements
        }

    def get_achievement_progress(self, user_id: int) -> Dict[str, Any]:
        all_achievements = self.achievement_model.get_all()
        unlocked_ids = set(self.user_achievement_model.get_user_achievement_ids(user_id))

        user = self.user_model.get_by_id(user_id)
        best_records = self.record_model.get_best_records(user_id)

        user_stats = {
            'total_count': user.get('total_count', 0) if user else 0,
            'max_single_count': best_records.get('max_single_count', 0),
            'streak_days': user.get('streak_days', 0) if user else 0
        }

        progress_list = []
        for achievement in all_achievements:
            achievement_id = achievement.get('id')
            condition_type = achievement.get('condition_type')
            condition_value = achievement.get('condition_value', 0)

            current_value = 0
            if condition_type == self.achievement_model.CONDITION_TYPE_TOTAL:
                current_value = user_stats.get('total_count', 0)
            elif condition_type == self.achievement_model.CONDITION_TYPE_SINGLE:
                current_value = user_stats.get('max_single_count', 0)
            elif condition_type == self.achievement_model.CONDITION_TYPE_STREAK:
                current_value = user_stats.get('streak_days', 0)

            progress = min(100, (current_value / condition_value * 100)) if condition_value > 0 else 0

            progress_list.append({
                'achievement_id': achievement_id,
                'name': achievement.get('name'),
                'description': achievement.get('description'),
                'condition_type': condition_type,
                'condition_value': condition_value,
                'badge_icon': achievement.get('badge_icon'),
                'is_unlocked': achievement_id in unlocked_ids,
                'current_value': current_value,
                'progress': round(progress, 2)
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': progress_list
        }

    def get_recent_achievements(self, user_id: int, limit: int = 5) -> Dict[str, Any]:
        recent = self.user_achievement_model.get_recent_achievements(user_id, limit)

        formatted_achievements = []
        for ua in recent:
            formatted_achievements.append({
                'id': ua.get('id'),
                'achievement_id': ua.get('achievement_id'),
                'name': ua.get('name'),
                'description': ua.get('description'),
                'badge_icon': ua.get('badge_icon'),
                'unlocked_at': ua.get('unlocked_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': formatted_achievements
        }

    def get_achievement_by_id(self, achievement_id: int) -> Dict[str, Any]:
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

    def create_achievement(self, name: str, description: str, condition_type: str,
                            condition_value: int, badge_icon: str = '') -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': '成就名称不能为空',
                'data': None
            }

        valid_types = [
            self.achievement_model.CONDITION_TYPE_TOTAL,
            self.achievement_model.CONDITION_TYPE_SINGLE,
            self.achievement_model.CONDITION_TYPE_STREAK
        ]
        if condition_type not in valid_types:
            return {
                'code': 1,
                'msg': '无效的条件类型',
                'data': None
            }

        if condition_value <= 0:
            return {
                'code': 1,
                'msg': '条件值必须大于0',
                'data': None
            }

        achievement_id = self.achievement_model.create(
            name=name,
            description=description,
            condition_type=condition_type,
            condition_value=condition_value,
            badge_icon=badge_icon
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

    def get_achievement_stats(self, user_id: int) -> Dict[str, Any]:
        unlocked_count = self.user_achievement_model.get_achievement_count(user_id)
        total_count = len(self.achievement_model.get_all())

        achievement_progress = self.get_achievement_progress(user_id)
        progress_data = achievement_progress.get('data', [])

        stats_by_type = {}
        for item in progress_data:
            condition_type = item.get('condition_type')
            if condition_type not in stats_by_type:
                stats_by_type[condition_type] = {
                    'total': 0,
                    'unlocked': 0
                }
            stats_by_type[condition_type]['total'] += 1
            if item.get('is_unlocked'):
                stats_by_type[condition_type]['unlocked'] += 1

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_achievements': total_count,
                'unlocked_count': unlocked_count,
                'unlock_rate': round((unlocked_count / total_count * 100), 2) if total_count > 0 else 0,
                'stats_by_type': stats_by_type
            }
        }
