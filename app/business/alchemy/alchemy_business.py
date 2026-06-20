import json
from typing import Dict, Any, List, Optional
from app.model.alchemy import AlchemyRecipeModel, AlchemyGameModel


class AlchemyBusiness:
    def __init__(self):
        self.recipe_model = AlchemyRecipeModel()
        self.game_model = AlchemyGameModel()

    def get_recipes(self) -> Dict[str, Any]:
        recipes = self.recipe_model.get_all()
        return {
            'code': 0,
            'message': 'success',
            'data': recipes
        }

    def start_game(self, player_name: str) -> Dict[str, Any]:
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'player_name': player_name,
                'duration': 900,
                'furnace_layers': 6,
                'cooling_rate': 30,
                'cooling_interval': 10,
                'cooldown_duration': 30,
                'cooldown_temp_reduction': 100,
                'burn_penalty': 20,
            }
        }

    def end_game(self, player_name: str, score: int, details: str = '') -> Dict[str, Any]:
        new_id = self.game_model.create(player_name, score, details)
        record = self.game_model.get_by_id(new_id)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': record.get('id'),
                'player_name': record.get('player_name'),
                'score': record.get('score'),
            }
        }

    def get_leaderboard(self, limit: int = 20) -> Dict[str, Any]:
        records = self.game_model.get_leaderboard(limit)
        return {
            'code': 0,
            'message': 'success',
            'data': records
        }

    def validate_forging(self, mat1: str, mat2: str, forging_temp: int) -> Dict[str, Any]:
        recipe = self.recipe_model.find_by_materials(mat1, mat2)
        if not recipe:
            return {
                'code': 1,
                'message': '没有匹配的锻造配方',
                'data': None
            }

        deviation = abs(forging_temp - recipe['ideal_temp'])
        quality = '传说'
        quality_multiplier = 4.0
        if deviation > 150:
            quality = '普通'
            quality_multiplier = 1.0
        elif deviation > 100:
            quality = '稀有'
            quality_multiplier = 2.0
        elif deviation > 50:
            quality = '史诗'
            quality_multiplier = 3.0

        final_score = int(recipe['base_score'] * quality_multiplier)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'equipment_name': recipe['name'],
                'quality': quality,
                'quality_multiplier': quality_multiplier,
                'base_score': recipe['base_score'],
                'final_score': final_score,
                'deviation': deviation,
                'ideal_temp': recipe['ideal_temp'],
            }
        }
