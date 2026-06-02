from typing import Dict, Any, Optional
from app.model.jinwutuan import AchievementModel, UserAchievementModel


class JinwutuanAchievementBusiness:
    def __init__(self):
        self.achievement_model = AchievementModel()
        self.user_achievement_model = UserAchievementModel()

    def get_all_achievements(self) -> Dict[str, Any]:
        achievements = self.achievement_model.query.find_all(
            {'status': AchievementModel.STATUS_ENABLED},
            order_by='id ASC'
        )
        items = [self.achievement_model.to_dict(ach) for ach in achievements]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_user_achievements(self, user_id: int) -> Dict[str, Any]:
        all_achievements = self.achievement_model.query.find_all(
            {'status': AchievementModel.STATUS_ENABLED},
            order_by='id ASC'
        )
        user_achs = self.user_achievement_model.get_user_achievements(user_id)
        user_ach_map = {ua.get('achievement_id'): ua for ua in user_achs}

        items = []
        for ach in all_achievements:
            ach_data = self.achievement_model.to_dict(ach)
            ua = user_ach_map.get(ach.get('id'))
            if ua:
                ach_data['progress'] = ua.get('progress', 0)
                ach_data['unlocked'] = ua.get('unlocked', 0)
                ach_data['unlocked_at'] = ua.get('unlocked_at')
            else:
                ach_data['progress'] = 0
                ach_data['unlocked'] = 0
                ach_data['unlocked_at'] = None
            items.append(ach_data)

        unlocked_count = sum(1 for item in items if item.get('unlocked'))

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': len(items),
                'unlocked_count': unlocked_count
            }
        }

    def check_achievements(self, user_id: int) -> Dict[str, Any]:
        achievements = self.achievement_model.query.find_all(
            {'status': AchievementModel.STATUS_ENABLED},
            order_by='id ASC'
        )

        newly_unlocked = []
        for ach in achievements:
            ach_id = ach.get('id')
            condition_type = ach.get('condition_type')
            condition_value = ach.get('condition_value')

            current_value = self._check_achievement_condition(user_id, condition_type, condition_value)
            if current_value is None:
                continue

            result = self.user_achievement_model.check_and_unlock(user_id, ach_id, current_value)
            if result and result.get('unlocked'):
                existing = self.user_achievement_model.query.find_one({
                    'user_id': user_id,
                    'achievement_id': ach_id
                })
                if existing and not existing.get('unlocked'):
                    pass
                elif result.get('unlocked_at') and result.get('progress') >= (condition_value if condition_value > 0 else 1):
                    newly_unlocked.append(self.achievement_model.to_dict(ach))

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'newly_unlocked': newly_unlocked
            }
        }

    def _check_achievement_condition(self, user_id: int, condition_type: str,
                                      condition_value: int) -> Optional[int]:
        from app.model.jinwutuan import GameStatsModel, ScoreModel

        if condition_type == 'total_games':
            stats_model = GameStatsModel()
            stats = stats_model.get_by_user_id(user_id)
            return stats.get('total_games', 0) if stats else 0

        elif condition_type == 'single_score':
            score_model = ScoreModel()
            top_scores = score_model.get_top_scores(limit=100)
            user_scores = [s for s in top_scores if s.get('user_id') == user_id]
            return max((s.get('score', 0) for s in user_scores), default=0)

        elif condition_type == 'max_combo':
            stats_model = GameStatsModel()
            stats = stats_model.get_by_user_id(user_id)
            return stats.get('max_combo', 0) if stats else 0

        elif condition_type == 'unique_songs':
            score_model = ScoreModel()
            user_scores = score_model.query.find_all({'user_id': user_id})
            unique_songs = set(s.get('song_id') for s in user_scores)
            return len(unique_songs)

        return None
