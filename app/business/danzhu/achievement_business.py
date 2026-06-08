from typing import Dict, Any, List, Optional
from app.model.danzhu import AchievementModel, UserAchievementModel
from app.business.auth import AuthBusiness
import json


class AchievementBusiness:
    def __init__(self):
        self.achievement_model = AchievementModel()
        self.user_achievement_model = UserAchievementModel()
        self.auth_business = AuthBusiness()

    def get_all_achievements(self, token: str = None) -> Dict[str, Any]:
        achievements = self.achievement_model.get_all()

        user_achievements = []
        if token:
            user = self.auth_business.verify_token(token)
            if user:
                user_achievements = self.user_achievement_model.get_user_achievements(user.get('id'))

        result = []
        for ach in achievements:
            item = {
                'id': ach.get('id'),
                'code': ach.get('code'),
                'name': ach.get('name'),
                'description': ach.get('description'),
                'icon': ach.get('icon'),
                'type': ach.get('type'),
                'sort_order': ach.get('sort_order'),
                'is_unlocked': False,
                'progress': None
            }

            if token and user_achievements:
                for ua in user_achievements:
                    if ua.get('achievement_code') == ach.get('code'):
                        item['is_unlocked'] = ua.get('is_unlocked', 0) == 1
                        item['progress'] = ua.get('progress_json')
                        if ua.get('unlocked_at'):
                            item['unlocked_at'] = ua.get('unlocked_at')
                        break

            result.append(item)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': result,
                'total': len(result)
            }
        }

    def check_unlock_achievements(self, token: str, game_data: Dict[str, Any]) -> Dict[str, Any]:
        user = self.auth_business.verify_token(token)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }

        user_id = user.get('id')
        newly_unlocked = []

        score = game_data.get('score', 0)
        combo = game_data.get('highest_combo', 0)
        gadget_types = game_data.get('gadget_types', [])
        levels_played = game_data.get('levels_played', [])
        launch_count = game_data.get('launch_count', 0)

        achievements = self.achievement_model.get_all()
        for ach in achievements:
            code = ach.get('code')
            condition_json = ach.get('condition_json', '{}')
            try:
                condition = json.loads(condition_json)
            except (json.JSONDecodeError, TypeError):
                continue

            condition_type = condition.get('type')
            should_unlock = False

            if condition_type == 'score':
                target = condition.get('value', 0)
                if score >= target:
                    should_unlock = True
            elif condition_type == 'combo':
                target = condition.get('value', 0)
                if combo >= target:
                    should_unlock = True
            elif condition_type == 'all_gadgets':
                all_types = {'bumper', 'accelerator', 'rotator', 'portal_in', 'multiplier', 'splitter'}
                if all(t in gadget_types for t in all_types):
                    should_unlock = True
            elif condition_type == 'all_levels':
                if len(levels_played) >= 1:
                    should_unlock = True
            elif condition_type == 'launch':
                if launch_count >= 1:
                    should_unlock = True
            elif condition_type == 'launch_total':
                target = condition.get('value', 100)
                total_launches = self.user_achievement_model.get_total_launches(user_id) + launch_count
                self.user_achievement_model.update_launch_count(user_id, total_launches)
                if total_launches >= target:
                    should_unlock = True

            if should_unlock:
                unlocked = self.user_achievement_model.unlock(
                    user_id=user_id,
                    achievement_id=ach.get('id'),
                    achievement_code=code
                )
                if unlocked:
                    newly_unlocked.append({
                        'code': code,
                        'name': ach.get('name'),
                        'icon': ach.get('icon'),
                        'description': ach.get('description')
                    })

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'newly_unlocked': newly_unlocked,
                'total_unlocked': self.user_achievement_model.get_unlocked_count(user_id)
            }
        }

    def update_launch_count(self, token: str, count: int) -> Dict[str, Any]:
        user = self.auth_business.verify_token(token)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }

        self.user_achievement_model.update_launch_count(user.get('id'), count)
        return {
            'code': 0,
            'message': 'success',
            'data': None
        }
