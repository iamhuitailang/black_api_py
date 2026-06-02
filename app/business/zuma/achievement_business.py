from typing import Dict, Any, List
from app.model.zuma_model import ZumaAchievementModel, ZumaUserAchievementModel, ZumaUserModel


class ZumaAchievementBusiness:
    def __init__(self):
        self.achievement_model = ZumaAchievementModel()
        self.user_achievement_model = ZumaUserAchievementModel()
        self.user_model = ZumaUserModel()

    def get_all_achievements(self, user_id: int = None) -> Dict[str, Any]:
        all_achievements = self.achievement_model.get_all()

        if user_id:
            unlocked_ids = self.user_achievement_model.get_user_achievement_ids(user_id)
            for ach in all_achievements:
                ach['unlocked'] = ach['id'] in unlocked_ids
        else:
            for ach in all_achievements:
                ach['unlocked'] = False

        return {
            'code': 0,
            'msg': 'success',
            'data': all_achievements
        }

    def get_user_achievements(self, user_id: int) -> Dict[str, Any]:
        achievements = self.user_achievement_model.get_by_user_id(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': achievements
        }

    def check_and_unlock_achievements(self, user_id: int) -> List[Dict[str, Any]]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return []

        all_achievements = self.achievement_model.get_all()
        unlocked_ids = self.user_achievement_model.get_user_achievement_ids(user_id)

        newly_unlocked = []

        for ach in all_achievements:
            if ach['id'] in unlocked_ids:
                continue

            unlocked = False
            category = ach.get('category', '')
            requirement = ach.get('requirement', 0)

            if category == ZumaAchievementModel.CATEGORY_SCORE:
                if user.get('high_score', 0) >= requirement:
                    unlocked = True

            elif category == ZumaAchievementModel.CATEGORY_COMBO:
                if user.get('max_combo', 0) >= requirement:
                    unlocked = True

            elif category == ZumaAchievementModel.CATEGORY_LEVEL:
                if user.get('level', 1) >= requirement:
                    unlocked = True

            elif category == ZumaAchievementModel.CATEGORY_GAMES:
                if user.get('total_games', 0) >= requirement:
                    unlocked = True

            if unlocked:
                self.user_achievement_model.create(user_id, ach['id'])
                self.user_model.update_coins(user_id, ach.get('reward_coins', 0))
                newly_unlocked.append(ach)

        return newly_unlocked
