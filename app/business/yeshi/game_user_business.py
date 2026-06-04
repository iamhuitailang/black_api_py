from typing import Dict, Any, Optional
from app.model.yeshi import GameUserModel, UserFoodModel, UserUpgradeModel
from app.model.auth import UserModel


class GameUserBusiness:
    def __init__(self):
        self.game_user_model = GameUserModel()
        self.user_food_model = UserFoodModel()
        self.user_upgrade_model = UserUpgradeModel()
        self.user_model = UserModel()

    def get_or_create_game_user(self, user_id: int) -> Dict[str, Any]:
        game_user = self.game_user_model.get_by_user_id(user_id)
        if game_user:
            self.game_user_model.update_last_login(game_user['id'])
            return {
                'code': 0,
                'message': 'success',
                'data': game_user
            }
        
        auth_user = self.user_model.get_by_id(user_id)
        if not auth_user:
            return {
                'code': 1,
                'message': '用户不存在',
                'data': None
            }
        
        game_user_id = self.game_user_model.create(
            user_id=user_id,
            username=auth_user.get('username', '')
        )
        
        self._init_default_user_foods(game_user_id)
        
        game_user = self.game_user_model.get_by_id(game_user_id)
        
        return {
            'code': 0,
            'message': '游戏用户创建成功',
            'data': game_user
        }

    def _init_default_user_foods(self, game_user_id: int):
        from app.model.yeshi import FoodModel
        food_model = FoodModel()
        default_foods = food_model.get_default_foods()
        
        for food in default_foods:
            self.user_food_model.create(
                game_user_id=game_user_id,
                food_id=food['id'],
                food_name=food['name'],
                is_unlocked=1
            )

    def get_game_user_info(self, game_user_id: int) -> Dict[str, Any]:
        game_user = self.game_user_model.get_by_id(game_user_id)
        if not game_user:
            return {
                'code': 1,
                'message': '游戏用户不存在',
                'data': None
            }
        
        unlocked_foods = self.user_food_model.get_unlocked_by_user_id(game_user_id)
        upgrades = self.user_upgrade_model.get_upgraded_by_user_id(game_user_id)
        effects = self.user_upgrade_model.get_total_effects(game_user_id)
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'user': game_user,
                'unlocked_foods': unlocked_foods,
                'upgrades': upgrades,
                'effects': effects
            }
        }

    def update_game_user(self, game_user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        affected = self.game_user_model.update(game_user_id, data)
        if affected > 0:
            game_user = self.game_user_model.get_by_id(game_user_id)
            return {
                'code': 0,
                'message': '更新成功',
                'data': game_user
            }
        return {
            'code': 1,
            'message': '更新失败',
            'data': None
        }

    def add_gold(self, game_user_id: int, amount: int) -> Dict[str, Any]:
        new_gold = self.game_user_model.add_gold(game_user_id, amount)
        return {
            'code': 0,
            'message': 'success',
            'data': {'new_gold': new_gold}
        }

    def add_experience(self, game_user_id: int, exp: int) -> Dict[str, Any]:
        result = self.game_user_model.add_experience(game_user_id, exp)
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_leaderboard(self, limit: int = 10) -> Dict[str, Any]:
        all_users = self.game_user_model.get_all()
        leaderboard = all_users[:limit]
        return {
            'code': 0,
            'message': 'success',
            'data': leaderboard
        }
