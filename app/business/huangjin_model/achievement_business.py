from typing import Dict, Any, List
from app.model.huangjin_model import AchievementModel, UserAchievementModel, HuangjinUserModel


class AchievementBusiness:
    def __init__(self):
        self.achievement_model = AchievementModel()
        self.user_achievement_model = UserAchievementModel()
        self.user_model = HuangjinUserModel()

    def get_all_achievements(self, page: int = 1, page_size: int = 10,
                             status: int = None, condition_type: str = None) -> Dict[str, Any]:
        result = self.achievement_model.get_all(page, page_size, status, condition_type)
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

    def get_user_achievements(self, user_id: int) -> Dict[str, Any]:
        all_achievements = self.achievement_model.get_enabled()
        unlocked_ids = self.user_achievement_model.get_unlocked_ids(user_id)
        unlocked_records = self.user_achievement_model.get_by_user(user_id)
        unlocked_map = {r.get('achievement_id'): r.get('unlocked_at') for r in unlocked_records}

        items = []
        for ach in all_achievements:
            ach_dict = self.achievement_model.to_dict(ach)
            ach_id = ach.get('id')
            if ach_id in unlocked_ids:
                ach_dict['unlocked'] = True
                ach_dict['unlocked_at'] = unlocked_map.get(ach_id)
            else:
                ach_dict['unlocked'] = False
                ach_dict['unlocked_at'] = None
            items.append(ach_dict)

        unlocked_count = len(unlocked_ids)
        total_count = len(all_achievements)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'unlocked_count': unlocked_count,
                'total_count': total_count
            }
        }

    def check_achievements(self, user_id: int, score: int, ore_count: int) -> List[Dict[str, Any]]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return []

        new_achievements = []
        all_achievements = self.achievement_model.get_enabled()
        unlocked_ids = self.user_achievement_model.get_unlocked_ids(user_id)

        for ach in all_achievements:
            ach_id = ach.get('id')
            if ach_id in unlocked_ids:
                continue

            condition_type = ach.get('condition_type')
            condition_value = ach.get('condition_value')
            achieved = False

            if condition_type == AchievementModel.TYPE_SCORE:
                if score >= condition_value:
                    achieved = True
            elif condition_type == AchievementModel.TYPE_GAMES:
                total_games = user.get('total_games', 0) + 1
                if total_games >= condition_value:
                    achieved = True
            elif condition_type == AchievementModel.TYPE_ORE:
                if ore_count >= condition_value:
                    achieved = True
            elif condition_type == AchievementModel.TYPE_SPECIAL:
                total_enabled = len(all_achievements)
                if len(unlocked_ids) + (1 if achieved else 0) >= total_enabled - 1:
                    pass

            if achieved:
                self.user_achievement_model.unlock(user_id, ach_id)
                unlocked_ids.append(ach_id)
                new_achievements.append(self.achievement_model.to_dict(ach))

        return new_achievements

    def create_achievement(self, name: str, description: str, condition_type: str,
                           condition_value: int, icon: str = '', badge_color: str = '#FFD700',
                           sort_order: int = 0) -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': '成就名称不能为空',
                'data': None
            }
        if condition_type not in [AchievementModel.TYPE_SCORE, AchievementModel.TYPE_GAMES,
                                  AchievementModel.TYPE_ORE, AchievementModel.TYPE_SPECIAL]:
            return {
                'code': 1,
                'msg': '无效的成就类型',
                'data': None
            }

        ach_id = self.achievement_model.create(
            name, description, condition_type, condition_value,
            icon, badge_color, sort_order
        )
        if ach_id > 0:
            ach = self.achievement_model.get_by_id(ach_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.achievement_model.to_dict(ach)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_achievement(self, achievement_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        ach = self.achievement_model.get_by_id(achievement_id)
        if not ach:
            return {
                'code': 1,
                'msg': '成就不存在',
                'data': None
            }

        affected = self.achievement_model.update(achievement_id, data)
        if affected >= 0:
            updated_ach = self.achievement_model.get_by_id(achievement_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.achievement_model.to_dict(updated_ach)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_achievement(self, achievement_id: int) -> Dict[str, Any]:
        ach = self.achievement_model.get_by_id(achievement_id)
        if not ach:
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

    def toggle_achievement_status(self, achievement_id: int) -> Dict[str, Any]:
        ach = self.achievement_model.get_by_id(achievement_id)
        if not ach:
            return {
                'code': 1,
                'msg': '成就不存在',
                'data': None
            }

        new_status = self.achievement_model.STATUS_DISABLED if ach.get('status') == self.achievement_model.STATUS_ENABLED else self.achievement_model.STATUS_ENABLED
        affected = self.achievement_model.update_status(achievement_id, new_status)
        if affected > 0:
            updated_ach = self.achievement_model.get_by_id(achievement_id)
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': self.achievement_model.to_dict(updated_ach)
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }
