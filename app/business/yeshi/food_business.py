from typing import Dict, Any, List, Optional
from app.model.yeshi import FoodModel, UserFoodModel, GameUserModel


class FoodBusiness:
    def __init__(self):
        self.food_model = FoodModel()
        self.user_food_model = UserFoodModel()
        self.game_user_model = GameUserModel()

    def get_all_foods(self, page: int = 1, page_size: int = 50) -> Dict[str, Any]:
        foods = self.food_model.get_all(page, page_size)
        total = self.food_model.count()
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'list': foods,
                'total': total,
                'page': page,
                'page_size': page_size
            }
        }

    def get_food_by_id(self, food_id: int) -> Dict[str, Any]:
        food = self.food_model.get_by_id(food_id)
        if not food:
            return {
                'code': 1,
                'message': '食物不存在',
                'data': None
            }
        return {
            'code': 0,
            'message': 'success',
            'data': food
        }

    def get_foods_by_category(self, category: str) -> Dict[str, Any]:
        foods = self.food_model.get_by_category(category)
        return {
            'code': 0,
            'message': 'success',
            'data': foods
        }

    def get_user_unlocked_foods(self, game_user_id: int) -> Dict[str, Any]:
        user_foods = self.user_food_model.get_unlocked_by_user_id(game_user_id)
        
        food_ids = [uf['food_id'] for uf in user_foods]
        foods = []
        for fid in food_ids:
            food = self.food_model.get_by_id(fid)
            if food:
                user_food = next((uf for uf in user_foods if uf['food_id'] == fid), None)
                if user_food:
                    food['proficiency'] = user_food.get('proficiency', 0)
                    food['cook_count'] = user_food.get('cook_count', 0)
                    food['success_count'] = user_food.get('success_count', 0)
                foods.append(food)
        
        return {
            'code': 0,
            'message': 'success',
            'data': foods
        }

    def get_unlockable_foods(self, game_user_id: int) -> Dict[str, Any]:
        game_user = self.game_user_model.get_by_id(game_user_id)
        if not game_user:
            return {
                'code': 1,
                'message': '游戏用户不存在',
                'data': None
            }
        
        user_level = game_user.get('level', 1)
        user_gold = game_user.get('gold', 0)
        
        unlockable = self.food_model.get_unlockable_by_level(user_level)
        
        user_unlocked = self.user_food_model.get_unlocked_by_user_id(game_user_id)
        unlocked_ids = [uf['food_id'] for uf in user_unlocked]
        
        result = []
        for food in unlockable:
            if food['id'] not in unlocked_ids:
                food['can_afford'] = user_gold >= food.get('unlock_cost', 0)
                result.append(food)
        
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def unlock_food(self, game_user_id: int, food_id: int) -> Dict[str, Any]:
        game_user = self.game_user_model.get_by_id(game_user_id)
        if not game_user:
            return {
                'code': 1,
                'message': '游戏用户不存在',
                'data': None
            }
        
        food = self.food_model.get_by_id(food_id)
        if not food:
            return {
                'code': 1,
                'message': '食物不存在',
                'data': None
            }
        
        existing = self.user_food_model.get_by_user_and_food(game_user_id, food_id)
        if existing and existing.get('is_unlocked') == 1:
            return {
                'code': 1,
                'message': '该食物已解锁',
                'data': None
            }
        
        unlock_cost = food.get('unlock_cost', 0)
        user_gold = game_user.get('gold', 0)
        
        if user_gold < unlock_cost:
            return {
                'code': 1,
                'message': '金币不足',
                'data': {
                    'need': unlock_cost,
                    'have': user_gold
                }
            }
        
        self.game_user_model.update_gold(game_user_id, user_gold - unlock_cost)
        
        self.user_food_model.unlock_food(game_user_id, food_id)
        
        return {
            'code': 0,
            'message': '解锁成功',
            'data': {
                'food': food,
                'remaining_gold': user_gold - unlock_cost
            }
        }

    def record_cook(self, game_user_id: int, food_id: int, success: bool = True) -> Dict[str, Any]:
        user_food = self.user_food_model.get_by_user_and_food(game_user_id, food_id)
        if not user_food:
            food = self.food_model.get_by_id(food_id)
            if food:
                self.user_food_model.create(game_user_id, food_id, food['name'], 1)
                user_food = self.user_food_model.get_by_user_and_food(game_user_id, food_id)
        
        if user_food:
            result = self.user_food_model.add_cook_count(user_food['id'], success)
            return {
                'code': 0,
                'message': 'success',
                'data': result
            }
        
        return {
            'code': 1,
            'message': '记录失败',
            'data': None
        }

    def get_categories(self) -> Dict[str, Any]:
        categories = ['烤串', '炒面', '麻辣烫', '甜品', '饮品', '海鲜', '小吃', '汤品', '素菜']
        return {
            'code': 0,
            'message': 'success',
            'data': categories
        }

    def create_food(self, data: Dict[str, Any]) -> Dict[str, Any]:
        food_id = self.food_model.create(data)
        food = self.food_model.get_by_id(food_id)
        return {
            'code': 0,
            'message': '创建成功',
            'data': food
        }

    def update_food(self, food_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        affected = self.food_model.update(food_id, data)
        if affected > 0:
            food = self.food_model.get_by_id(food_id)
            return {
                'code': 0,
                'message': '更新成功',
                'data': food
            }
        return {
            'code': 1,
            'message': '更新失败',
            'data': None
        }

    def delete_food(self, food_id: int) -> Dict[str, Any]:
        affected = self.food_model.delete(food_id)
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
