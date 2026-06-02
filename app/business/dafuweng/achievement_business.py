from typing import Dict, Any
from app.model.dafuweng import AchievementModel, PlayerAchievementModel


class AchievementBusiness:
    def __init__(self):
        self.achievement_model = AchievementModel()
        self.player_achievement_model = PlayerAchievementModel()

    def get_all_achievements(self) -> Dict[str, Any]:
        achievements = self.achievement_model.get_all()
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.achievement_model.to_dict(a) for a in achievements]
        }

    def get_user_achievements(self, user_id: int) -> Dict[str, Any]:
        records = self.player_achievement_model.get_by_user_id(user_id)
        result = []
        for record in records:
            achievement = self.achievement_model.get_by_id(record.get('achievement_id'))
            if achievement:
                item = self.achievement_model.to_dict(achievement)
                item['unlocked_at'] = record.get('unlocked_at')
                result.append(item)

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def check_and_unlock(self, user_id: int, condition_type: str, condition_value: int) -> Dict[str, Any]:
        achievements = self.achievement_model.get_active_achievements()
        unlocked = []

        for achievement in achievements:
            if achievement.get('condition_type') != condition_type:
                continue

            if self.player_achievement_model.check_unlocked(user_id, achievement.get('id')):
                continue

            if condition_value >= achievement.get('condition_value', 0):
                self.player_achievement_model.create(user_id, achievement.get('id'))
                unlocked.append(self.achievement_model.to_dict(achievement))

        return {
            'code': 0,
            'msg': 'success',
            'data': unlocked
        }

    def create_achievement(self, data: Dict[str, Any]) -> Dict[str, Any]:
        name = data.get('name')
        condition_type = data.get('condition_type')

        if not name or not condition_type:
            return {
                'code': 1,
                'msg': '缺少必要参数',
                'data': None
            }

        achievement_id = self.achievement_model.create(
            name=name,
            description=data.get('description', ''),
            condition_type=condition_type,
            condition_value=data.get('condition_value', 0),
            reward_coins=data.get('reward_coins', 0),
            icon=data.get('icon', '')
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
