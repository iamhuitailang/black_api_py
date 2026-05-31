from typing import Dict, Any, List
from app.model.chengyu_077.achievement import AchievementModel
from app.model.chengyu_077.user_achievement import UserAchievementModel
from app.model.chengyu_077.user import ChengyuUserModel


class AchievementBusiness:
    def __init__(self):
        self.achievement_model = AchievementModel()
        self.user_achievement_model = UserAchievementModel()
        self.user_model = ChengyuUserModel()

    def get_all_achievements(self) -> Dict[str, Any]:
        achievements = self.achievement_model.get_all()
        return {'code': 0, 'message': 'success', 'data': achievements}

    def get_my_achievements(self, user_id: int) -> Dict[str, Any]:
        user_achievements = self.user_achievement_model.get_by_user(user_id)
        result = []
        for ua in user_achievements:
            achievement = self.achievement_model.get_by_id(ua.get('achievement_id'))
            if achievement:
                achievement['unlocked_at'] = ua.get('unlocked_at')
                result.append(achievement)
        return {'code': 0, 'message': 'success', 'data': result}

    def check_and_unlock(self, user_id: int, score: int, combo: int, won: bool) -> None:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return

        total_games = (user.get('total_games') or 0)
        total_wins = (user.get('total_wins') or 0)

        conditions = {
            'total_games': total_games,
            'total_wins': total_wins,
            'single_score': score,
            'max_combo': combo,
        }

        all_achievements = self.achievement_model.get_all()
        for ach in all_achievements:
            cond_type = ach.get('condition_type', '')
            cond_val = ach.get('condition_value', 0)
            if cond_type in conditions:
                if conditions[cond_type] >= cond_val:
                    self.user_achievement_model.unlock(user_id, ach.get('id'))

    def unlock_achievement(self, user_id: int, achievement_id: int) -> Dict[str, Any]:
        achievement = self.achievement_model.get_by_id(achievement_id)
        if not achievement:
            return {'code': 1, 'message': '成就不存在', 'data': None}
        if self.user_achievement_model.is_unlocked(user_id, achievement_id):
            return {'code': 1, 'message': '成就已解锁', 'data': None}
        self.user_achievement_model.unlock(user_id, achievement_id)
        return {'code': 0, 'message': '成就解锁成功', 'data': achievement}
