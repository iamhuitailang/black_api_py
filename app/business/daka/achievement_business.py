from typing import Dict, Any, List, Optional
from app.model.daka import AchievementModel, UserAchievementModel


class DakaAchievementBusiness:
    def __init__(self):
        self.achievement_model = AchievementModel()
        self.user_achievement_model = UserAchievementModel()

    def get_all_achievements(self, user_id: int = None) -> Dict[str, Any]:
        all_achievements = self.achievement_model.get_all()
        result = []

        user_achievement_ids = set()
        if user_id:
            user_achievements = self.user_achievement_model.get_user_achievements(user_id)
            user_achievement_ids = {ua.get('achievement_id') for ua in user_achievements}

        for achievement in all_achievements:
            ach_dict = self.achievement_model.to_dict(achievement)
            ach_dict['is_unlocked'] = achievement.get('id') in user_achievement_ids
            ach_dict['unlocked_at'] = None

            if user_id and ach_dict['is_unlocked']:
                user_ach = self.user_achievement_model.get_user_achievement(
                    user_id, achievement.get('id')
                )
                if user_ach:
                    ach_dict['unlocked_at'] = user_ach.get('unlocked_at')

            result.append(ach_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_user_achievements(self, user_id: int) -> Dict[str, Any]:
        user_achievements = self.user_achievement_model.get_user_achievements(user_id)
        result = [self.user_achievement_model.to_dict(ua) for ua in user_achievements]

        total_count = len(self.achievement_model.get_all())
        unlocked_count = len(result)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_count': total_count,
                'unlocked_count': unlocked_count,
                'items': result
            }
        }

    def get_achievements_by_category(self, category: str, user_id: int = None) -> Dict[str, Any]:
        achievements = self.achievement_model.get_by_category(category)
        result = []

        user_achievement_ids = set()
        if user_id:
            user_achievements = self.user_achievement_model.get_user_achievements(user_id)
            user_achievement_ids = {ua.get('achievement_id') for ua in user_achievements}

        for achievement in achievements:
            ach_dict = self.achievement_model.to_dict(achievement)
            ach_dict['is_unlocked'] = achievement.get('id') in user_achievement_ids
            result.append(ach_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_achievement_detail(self, achievement_id: int, user_id: int = None) -> Dict[str, Any]:
        achievement = self.achievement_model.get_by_id(achievement_id)
        if not achievement:
            return {
                'code': 1,
                'msg': '成就不存在',
                'data': None
            }

        result = self.achievement_model.to_dict(achievement)
        result['is_unlocked'] = False
        result['unlocked_at'] = None

        if user_id:
            user_ach = self.user_achievement_model.get_user_achievement(user_id, achievement_id)
            if user_ach:
                result['is_unlocked'] = True
                result['unlocked_at'] = user_ach.get('unlocked_at')

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def check_new_achievements(self, user_id: int) -> Dict[str, Any]:
        new_achievements = self.user_achievement_model.check_and_unlock_achievements(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'new_count': len(new_achievements),
                'new_achievements': new_achievements
            }
        }

    def get_achievement_categories(self) -> Dict[str, Any]:
        categories = [
            {'value': 'streak', 'label': '连续打卡', 'icon': '🔥'},
            {'value': 'completion', 'label': '完成次数', 'icon': '🏆'},
            {'value': 'points', 'label': '积分成就', 'icon': '💎'},
            {'value': 'special', 'label': '特殊成就', 'icon': '🌟'},
        ]
        return {
            'code': 0,
            'msg': 'success',
            'data': categories
        }
