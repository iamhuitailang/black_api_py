from typing import Dict, Any
from app.model.heping_model import AchievementModel, UserAchievementModel


class AchievementBusiness:
    def __init__(self):
        self.achievement_model = AchievementModel()
        self.user_achievement_model = UserAchievementModel()

    def get_achievement_list(self) -> Dict[str, Any]:
        achievements = self.achievement_model.get_all()
        return {
            'code': 0,
            'msg': 'success',
            'data': achievements
        }

    def get_user_achievements(self, user_id: int) -> Dict[str, Any]:
        user_achievements = self.user_achievement_model.get_user_achievements(user_id)
        all_achievements = self.achievement_model.get_all()

        unlocked_ids = [ua.get('achievement_id') for ua in user_achievements]

        result = []
        for ach in all_achievements:
            ach_copy = dict(ach)
            ach_copy['unlocked'] = ach.get('id') in unlocked_ids
            for ua in user_achievements:
                if ua.get('achievement_id') == ach.get('id'):
                    ach_copy['unlocked_at'] = ua.get('unlocked_at')
                    break
            result.append(ach_copy)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'achievements': result,
                'total': len(all_achievements),
                'unlocked_count': len(unlocked_ids)
            }
        }

    def unlock_achievement(self, user_id: int, achievement_id: int) -> Dict[str, Any]:
        achievement = self.achievement_model.get_by_id(achievement_id)
        if not achievement:
            return {
                'code': 1,
                'msg': '成就不存在',
                'data': None
            }

        if self.user_achievement_model.check_unlocked(user_id, achievement_id):
            return {
                'code': 1,
                'msg': '成就已解锁',
                'data': None
            }

        self.user_achievement_model.create(user_id, achievement_id)
        return {
            'code': 0,
            'msg': '成就解锁成功',
            'data': {
                'achievement_id': achievement_id,
                'name': achievement.get('name'),
                'reward_exp': achievement.get('reward_exp')
            }
        }

    def check_and_unlock(self, user_id: int, condition_type: str, condition_value: int) -> Dict[str, Any]:
        all_achievements = self.achievement_model.get_all()
        newly_unlocked = []

        for ach in all_achievements:
            if ach.get('condition_type') != condition_type:
                continue

            if condition_value < ach.get('condition_value', 0):
                continue

            if self.user_achievement_model.check_unlocked(user_id, ach.get('id')):
                continue

            self.user_achievement_model.create(user_id, ach.get('id'))
            newly_unlocked.append({
                'achievement_id': ach.get('id'),
                'name': ach.get('name'),
                'reward_exp': ach.get('reward_exp')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'newly_unlocked': newly_unlocked
            }
        }
