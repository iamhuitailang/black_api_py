from typing import Dict, Any, List, Optional
from app.model.saiche_model import AchievementModel, UserAchievementModel, RaceRecordModel, UserModel


class SaicheAchievementBusiness:
    def __init__(self):
        self.achievement_model = AchievementModel()
        self.user_achievement_model = UserAchievementModel()
        self.race_record_model = RaceRecordModel()
        self.user_model = UserModel()

    def get_achievement_list(self, page: int = 1, page_size: int = 20,
                             condition_type: str = None) -> Dict[str, Any]:
        result = self.achievement_model.get_all(page, page_size, condition_type)
        items = [self.achievement_model.to_public_dict(item) for item in result.get('items', [])]

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
        achievements = self.user_achievement_model.get_all_with_achievements(user_id)
        items = [self.user_achievement_model.to_public_dict(a) for a in achievements]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def check_and_unlock_achievements(self, user_id: int) -> Dict[str, Any]:
        stats = self.race_record_model.get_user_stats(user_id)
        total_races = stats.get('total_races', 0)
        win_count = stats.get('win_count', 0)
        total_coins = self.race_record_model.get_total_coins_earned(user_id)
        track_count = stats.get('track_count', 0)
        consecutive_wins = self.race_record_model.get_consecutive_wins(user_id)

        user = self.user_model.get_by_id(user_id)
        level = user.get('level', 1) if user else 1

        conditions = {
            'race_count': total_races,
            'win_count': win_count,
            'coins': total_coins,
            'level': level,
            'track_count': track_count,
            'consecutive_win': consecutive_wins
        }

        newly_unlocked = []
        for condition_type, current_value in conditions.items():
            achievements = self.achievement_model.check_achievement(condition_type, current_value)
            for achievement in achievements:
                achievement_id = achievement.get('id')
                ua = self.user_achievement_model.get_by_user_and_achievement(user_id, achievement_id)
                if not ua or ua.get('is_unlocked') == 0:
                    affected = self.user_achievement_model.unlock(user_id, achievement_id)
                    if affected > 0:
                        newly_unlocked.append({
                            'achievement': self.achievement_model.to_public_dict(achievement),
                            'reward_coins': achievement.get('reward_coins', 0),
                            'reward_exp': achievement.get('reward_exp', 0)
                        })
                        if achievement.get('reward_coins', 0) > 0:
                            self.user_model.update_coins(user_id, achievement.get('reward_coins', 0))
                        if achievement.get('reward_exp', 0) > 0:
                            self.user_model.update_exp(user_id, achievement.get('reward_exp', 0))

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'newly_unlocked': newly_unlocked
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

        affected = self.user_achievement_model.unlock(user_id, achievement_id)
        if affected > 0:
            if achievement.get('reward_coins', 0) > 0:
                self.user_model.update_coins(user_id, achievement.get('reward_coins', 0))
            if achievement.get('reward_exp', 0) > 0:
                self.user_model.update_exp(user_id, achievement.get('reward_exp', 0))

            return {
                'code': 0,
                'msg': '解锁成功',
                'data': {
                    'reward_coins': achievement.get('reward_coins', 0),
                    'reward_exp': achievement.get('reward_exp', 0)
                }
            }

        return {
            'code': 1,
            'msg': '已经解锁过该成就',
            'data': None
        }

    def add_achievement(self, data: Dict[str, Any]) -> Dict[str, Any]:
        required_fields = ['name', 'condition_type', 'condition_value']
        for field in required_fields:
            if field not in data:
                return {
                    'code': 1,
                    'msg': f'缺少必填字段: {field}',
                    'data': None
                }

        achievement_id = self.achievement_model.create(data)
        if achievement_id > 0:
            achievement = self.achievement_model.get_by_id(achievement_id)
            return {
                'code': 0,
                'msg': '添加成功',
                'data': self.achievement_model.to_public_dict(achievement)
            }

        return {
            'code': 1,
            'msg': '添加失败',
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
        if affected > 0:
            updated_achievement = self.achievement_model.get_by_id(achievement_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.achievement_model.to_public_dict(updated_achievement)
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
