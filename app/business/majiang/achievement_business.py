from typing import Dict, Any, List, Optional
from app.model.majiang_model import AchievementModel, UserAchievementModel, UserModel


class MajiangAchievementBusiness:
    def __init__(self):
        self.achievement_model = AchievementModel()
        self.user_achievement_model = UserAchievementModel()
        self.user_model = UserModel()

    def get_all_achievements(self) -> Dict[str, Any]:
        achievements = self.achievement_model.get_all_active()
        items = [self.achievement_model.to_dict(a) for a in achievements]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_achievements_by_category(self, category: int) -> Dict[str, Any]:
        achievements = self.achievement_model.get_by_category(category)
        items = [self.achievement_model.to_dict(a) for a in achievements]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_user_achievements(self, user_id: int) -> Dict[str, Any]:
        unlocked = self.user_achievement_model.get_by_user_id(user_id)
        unlocked_ids = self.user_achievement_model.get_unlocked_ids(user_id)

        all_achievements = self.achievement_model.get_all_active()

        result = []
        for ach in all_achievements:
            ach_dict = self.achievement_model.to_dict(ach)
            ach_id = ach.get('id')
            ach_dict['unlocked'] = ach_id in unlocked_ids

            if ach_id in unlocked_ids:
                for ua in unlocked:
                    if ua.get('achievement_id') == ach_id:
                        ach_dict['unlocked_at'] = ua.get('unlocked_at')
                        ach_dict['reward_claimed'] = ua.get('reward_claimed', 0)
                        break

            result.append(ach_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def check_and_unlock_achievements(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        user_stats = {
            'total_games': user.get('total_games', 0),
            'wins': user.get('wins', 0),
            'losses': user.get('losses', 0),
            'max_fan': user.get('max_fan', 0),
            'win_streak': user.get('win_streak', 0)
        }

        unlocked_achievements = self.achievement_model.check_achievements(user_stats)
        unlocked_ids = self.user_achievement_model.get_unlocked_ids(user_id)

        newly_unlocked = []
        for ach in unlocked_achievements:
            ach_id = ach.get('id')
            if ach_id not in unlocked_ids:
                result = self.user_achievement_model.check_and_unlock(user_id, ach_id)
                if result:
                    newly_unlocked.append(result)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'newly_unlocked': newly_unlocked,
                'count': len(newly_unlocked)
            }
        }

    def claim_achievement_reward(self, user_id: int, achievement_id: int) -> Dict[str, Any]:
        record = self.user_achievement_model.get_by_user_and_achievement(user_id, achievement_id)
        if not record:
            return {
                'code': 1,
                'msg': '该成就尚未解锁',
                'data': None
            }

        if record.get('reward_claimed', 0) == 1:
            return {
                'code': 1,
                'msg': '奖励已领取',
                'data': None
            }

        achievement = self.achievement_model.get_by_id(achievement_id)
        if not achievement:
            return {
                'code': 1,
                'msg': '成就不存在',
                'data': None
            }

        reward_coins = achievement.get('reward_coins', 0)
        reward_exp = achievement.get('reward_exp', 0)

        if reward_coins > 0:
            self.user_model.update_coins(user_id, reward_coins)

        self.user_achievement_model.claim_reward(record.get('id'))

        return {
            'code': 0,
            'msg': '奖励领取成功',
            'data': {
                'reward_coins': reward_coins,
                'reward_exp': reward_exp
            }
        }

    def create_achievement(self, name: str, description: str, category: int,
                           condition_type: str, condition_value: int,
                           reward_coins: int = 0, reward_exp: int = 0,
                           icon: str = '', rarity: int = 1) -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': '成就名称不能为空',
                'data': None
            }

        if not description:
            return {
                'code': 1,
                'msg': '成就描述不能为空',
                'data': None
            }

        existing = self.achievement_model.get_by_name(name)
        if existing:
            return {
                'code': 1,
                'msg': '该成就名称已存在',
                'data': None
            }

        ach_id = self.achievement_model.create(name, description, category, condition_type,
                                               condition_value, reward_coins, reward_exp, icon, rarity)
        if ach_id > 0:
            achievement = self.achievement_model.get_by_id(ach_id)
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

        if 'name' in data:
            existing = self.achievement_model.get_by_name(data['name'])
            if existing and existing.get('id') != achievement_id:
                return {
                    'code': 1,
                    'msg': '该成就名称已存在',
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

    def get_achievement_list(self, page: int = 1, page_size: int = 10,
                             category: int = None, status: int = None) -> Dict[str, Any]:
        result = self.achievement_model.get_all(page, page_size, category, status)
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
