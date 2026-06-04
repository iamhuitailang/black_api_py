from typing import Dict, Any, List, Optional
from app.model.yeshi import UpgradeModel, UserUpgradeModel, GameUserModel


class UpgradeBusiness:
    def __init__(self):
        self.upgrade_model = UpgradeModel()
        self.user_upgrade_model = UserUpgradeModel()
        self.game_user_model = GameUserModel()

    def get_all_upgrades(self) -> Dict[str, Any]:
        upgrades = self.upgrade_model.get_all_active()
        return {
            'code': 0,
            'message': 'success',
            'data': upgrades
        }

    def get_upgrades_by_category(self, category: str) -> Dict[str, Any]:
        upgrades = self.upgrade_model.get_by_category(category)
        return {
            'code': 0,
            'message': 'success',
            'data': upgrades
        }

    def get_available_upgrades(self, game_user_id: int) -> Dict[str, Any]:
        game_user = self.game_user_model.get_by_id(game_user_id)
        if not game_user:
            return {
                'code': 1,
                'message': '游戏用户不存在',
                'data': None
            }
        
        user_level = game_user.get('level', 1)
        user_gold = game_user.get('gold', 0)
        
        available = self.upgrade_model.get_available_by_level(user_level)
        
        user_upgrades = self.user_upgrade_model.get_by_user_id(game_user_id)
        user_upgrade_map = {u['upgrade_id']: u['current_level'] for u in user_upgrades}
        
        result = []
        for upgrade in available:
            current_level = user_upgrade_map.get(upgrade['id'], 0)
            max_level = upgrade.get('max_level', 5)
            
            upgrade['current_level'] = current_level
            upgrade['is_maxed'] = current_level >= max_level
            
            if current_level < max_level:
                cost = self.upgrade_model.calculate_cost(upgrade, current_level)
                upgrade['next_cost'] = cost
                upgrade['can_afford'] = user_gold >= cost
            else:
                upgrade['next_cost'] = 0
                upgrade['can_afford'] = False
            
            result.append(upgrade)
        
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_user_upgrades(self, game_user_id: int) -> Dict[str, Any]:
        upgrades = self.user_upgrade_model.get_upgraded_by_user_id(game_user_id)
        
        result = []
        for uu in upgrades:
            upgrade = self.upgrade_model.get_by_id(uu['upgrade_id'])
            if upgrade:
                upgrade['current_level'] = uu.get('current_level', 0)
                result.append(upgrade)
        
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def purchase_upgrade(self, game_user_id: int, upgrade_id: int) -> Dict[str, Any]:
        game_user = self.game_user_model.get_by_id(game_user_id)
        if not game_user:
            return {
                'code': 1,
                'message': '游戏用户不存在',
                'data': None
            }
        
        upgrade = self.upgrade_model.get_by_id(upgrade_id)
        if not upgrade:
            return {
                'code': 1,
                'message': '升级项不存在',
                'data': None
            }
        
        user_level = game_user.get('level', 1)
        if user_level < upgrade.get('unlock_level', 1):
            return {
                'code': 1,
                'message': '等级不足，无法解锁该升级',
                'data': {
                    'need_level': upgrade.get('unlock_level', 1),
                    'current_level': user_level
                }
            }
        
        current_level = self.user_upgrade_model.get_current_level(game_user_id, upgrade_id)
        max_level = upgrade.get('max_level', 5)
        
        if current_level >= max_level:
            return {
                'code': 1,
                'message': '已达到最高等级',
                'data': None
            }
        
        cost = self.upgrade_model.calculate_cost(upgrade, current_level)
        user_gold = game_user.get('gold', 0)
        
        if user_gold < cost:
            return {
                'code': 1,
                'message': '金币不足',
                'data': {
                    'need': cost,
                    'have': user_gold
                }
            }
        
        self.game_user_model.update_gold(game_user_id, user_gold - cost)
        
        result = self.user_upgrade_model.upgrade(
            game_user_id,
            upgrade_id,
            upgrade.get('name', ''),
            max_level
        )
        
        effects = self.user_upgrade_model.get_total_effects(game_user_id)
        self._apply_effects(game_user_id, effects)
        
        return {
            'code': 0,
            'message': '升级成功',
            'data': {
                'upgrade': upgrade,
                'old_level': result.get('old_level', 0),
                'new_level': result.get('new_level', 1),
                'remaining_gold': user_gold - cost,
                'effects': effects
            }
        }

    def _apply_effects(self, game_user_id: int, effects: Dict[str, int]):
        game_user = self.game_user_model.get_by_id(game_user_id)
        if not game_user:
            return
        
        updates = {}
        
        if 'max_customers' in effects:
            base_max = 3 + game_user.get('level', 1)
            updates['max_customers'] = base_max + effects['max_customers']
        
        if 'cook_speed_bbq' in effects or 'cook_speed_fry' in effects:
            base_speed = 1
            speed_bonus = effects.get('cook_speed_bbq', 0) + effects.get('cook_speed_fry', 0)
            updates['cooking_speed'] = base_speed + speed_bonus // 10
        
        if updates:
            self.game_user_model.update(game_user_id, updates)

    def get_user_effects(self, game_user_id: int) -> Dict[str, Any]:
        effects = self.user_upgrade_model.get_total_effects(game_user_id)
        return {
            'code': 0,
            'message': 'success',
            'data': effects
        }

    def get_upgrade_categories(self) -> Dict[str, Any]:
        categories = [
            {'key': 'stall', 'name': '摊位', 'icon': '🏪'},
            {'key': 'tool', 'name': '工具', 'icon': '🔧'},
            {'key': 'skill', 'name': '技能', 'icon': '⭐'},
            {'key': 'decoration', 'name': '装饰', 'icon': '🎨'}
        ]
        return {
            'code': 0,
            'message': 'success',
            'data': categories
        }

    def create_upgrade(self, data: Dict[str, Any]) -> Dict[str, Any]:
        upgrade_id = self.upgrade_model.create(data)
        upgrade = self.upgrade_model.get_by_id(upgrade_id)
        return {
            'code': 0,
            'message': '创建成功',
            'data': upgrade
        }

    def update_upgrade(self, upgrade_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        affected = self.upgrade_model.update(upgrade_id, data)
        if affected > 0:
            upgrade = self.upgrade_model.get_by_id(upgrade_id)
            return {
                'code': 0,
                'message': '更新成功',
                'data': upgrade
            }
        return {
            'code': 1,
            'message': '更新失败',
            'data': None
        }

    def delete_upgrade(self, upgrade_id: int) -> Dict[str, Any]:
        affected = self.upgrade_model.delete(upgrade_id)
        if affected > 0:
            return {
                'code': 0,
                'message': '删除成功',
                'data': None
            }
        return {
            'code': 1,
            'message': '删除失败',
            'data': None
        }
