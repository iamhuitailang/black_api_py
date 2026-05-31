from typing import Dict, Any, List
from app.model.shipu_077_model import IngredientListModel, RecipeModel


class ShipuIngredientBusiness:
    def __init__(self):
        self.ingredient_list_model = IngredientListModel()
        self.recipe_model = RecipeModel()

    def create(self, user_id: int, recipe_id: int = 0, name: str = '', ingredients: List = None) -> Dict[str, Any]:
        if recipe_id > 0:
            recipe = self.recipe_model.get_by_id(recipe_id)
            if not recipe:
                return {
                    'code': 1,
                    'msg': '食谱不存在',
                    'data': None
                }

        list_id = self.ingredient_list_model.create(user_id, recipe_id, name, ingredients)
        if list_id > 0:
            ingredient_list = self.ingredient_list_model.get_by_id(list_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.ingredient_list_model.to_dict(ingredient_list)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def create_from_recipe(self, user_id: int, recipe_id: int) -> Dict[str, Any]:
        recipe = self.recipe_model.get_by_id(recipe_id)
        if not recipe:
            return {
                'code': 1,
                'msg': '食谱不存在',
                'data': None
            }

        recipe_dict = self.recipe_model.to_dict(recipe)
        ingredients = recipe_dict.get('ingredients', [])

        list_id = self.ingredient_list_model.create(
            user_id=user_id,
            recipe_id=recipe_id,
            name=recipe_dict.get('title', '') + ' - 食材清单',
            ingredients=ingredients
        )

        if list_id > 0:
            ingredient_list = self.ingredient_list_model.get_by_id(list_id)
            return {
                'code': 0,
                'msg': '生成食材清单成功',
                'data': self.ingredient_list_model.to_dict(ingredient_list)
            }

        return {
            'code': 1,
            'msg': '生成失败',
            'data': None
        }

    def update(self, list_id: int, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        ingredient_list = self.ingredient_list_model.get_by_id(list_id)
        if not ingredient_list:
            return {
                'code': 1,
                'msg': '清单不存在',
                'data': None
            }

        if ingredient_list.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限修改',
                'data': None
            }

        affected = self.ingredient_list_model.update(list_id, data)
        if affected >= 0:
            updated_list = self.ingredient_list_model.get_by_id(list_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.ingredient_list_model.to_dict(updated_list)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete(self, list_id: int, user_id: int) -> Dict[str, Any]:
        ingredient_list = self.ingredient_list_model.get_by_id(list_id)
        if not ingredient_list:
            return {
                'code': 1,
                'msg': '清单不存在',
                'data': None
            }

        if ingredient_list.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限删除',
                'data': None
            }

        affected = self.ingredient_list_model.delete(list_id)
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

    def get_by_id(self, list_id: int, user_id: int) -> Dict[str, Any]:
        ingredient_list = self.ingredient_list_model.get_by_id(list_id)
        if not ingredient_list:
            return {
                'code': 1,
                'msg': '清单不存在',
                'data': None
            }

        if ingredient_list.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限查看',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.ingredient_list_model.to_dict(ingredient_list)
        }

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10,
                    is_completed: int = None) -> Dict[str, Any]:
        result = self.ingredient_list_model.get_by_user(user_id, page, page_size, is_completed)
        items = [self.ingredient_list_model.to_dict(item) for item in result.get('items', [])]

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
