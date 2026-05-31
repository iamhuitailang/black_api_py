from typing import Dict, Any
from app.model.shipu_077_model import FavoriteModel, RecipeModel, UserModel


class ShipuFavoriteBusiness:
    def __init__(self):
        self.favorite_model = FavoriteModel()
        self.recipe_model = RecipeModel()
        self.user_model = UserModel()

    def toggle(self, user_id: int, recipe_id: int) -> Dict[str, Any]:
        recipe = self.recipe_model.get_by_id(recipe_id)
        if not recipe:
            return {
                'code': 1,
                'msg': '食谱不存在',
                'data': None
            }

        existing = self.favorite_model.get_by_user_and_recipe(user_id, recipe_id)
        if existing:
            affected = self.favorite_model.delete(user_id, recipe_id)
            if affected > 0:
                self.recipe_model.increment_favorite_count(recipe_id, -1)
                self.user_model.increment_favorite_count(user_id, -1)
                return {
                    'code': 0,
                    'msg': '取消收藏成功',
                    'data': {'is_favorited': False}
                }
        else:
            favorite_id = self.favorite_model.create(user_id, recipe_id)
            if favorite_id > 0:
                self.recipe_model.increment_favorite_count(recipe_id, 1)
                self.user_model.increment_favorite_count(user_id, 1)
                return {
                    'code': 0,
                    'msg': '收藏成功',
                    'data': {'is_favorited': True}
                }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def is_favorited(self, user_id: int, recipe_id: int) -> Dict[str, Any]:
        result = self.favorite_model.is_favorited(user_id, recipe_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {'is_favorited': result}
        }

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.favorite_model.get_by_user(user_id, page, page_size)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': result.get('items', []),
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }
