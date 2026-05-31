from typing import Dict, Any, List, Optional
from app.model.shipu_077_model import RecipeModel, UserModel, CategoryModel


class ShipuRecipeBusiness:
    def __init__(self):
        self.recipe_model = RecipeModel()
        self.user_model = UserModel()
        self.category_model = CategoryModel()

    def create(self, user_id: int, category_id: int, title: str,
               cover_image: str = '', description: str = '',
               ingredients: List = None, steps: List = None, tips: str = '',
               cook_time: int = 0, servings: int = 1, difficulty: str = 'easy') -> Dict[str, Any]:
        if not title:
            return {
                'code': 1,
                'msg': '食谱标题不能为空',
                'data': None
            }

        category = self.category_model.get_by_id(category_id)
        if not category:
            return {
                'code': 1,
                'msg': '分类不存在',
                'data': None
            }

        recipe_id = self.recipe_model.create(
            user_id=user_id,
            category_id=category_id,
            title=title,
            cover_image=cover_image,
            description=description,
            ingredients=ingredients,
            steps=steps,
            tips=tips,
            cook_time=cook_time,
            servings=servings,
            difficulty=difficulty
        )

        if recipe_id > 0:
            self.user_model.increment_recipe_count(user_id, 1)
            self.category_model.increment_recipe_count(category_id, 1)
            recipe = self.recipe_model.get_by_id(recipe_id)
            return {
                'code': 0,
                'msg': '发布成功，等待审核',
                'data': self.recipe_model.to_dict(recipe)
            }

        return {
            'code': 1,
            'msg': '发布失败',
            'data': None
        }

    def update(self, recipe_id: int, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        recipe = self.recipe_model.get_by_id(recipe_id)
        if not recipe:
            return {
                'code': 1,
                'msg': '食谱不存在',
                'data': None
            }

        if recipe.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限修改',
                'data': None
            }

        if 'category_id' in data:
            category = self.category_model.get_by_id(data['category_id'])
            if not category:
                return {
                    'code': 1,
                    'msg': '分类不存在',
                    'data': None
                }

        affected = self.recipe_model.update(recipe_id, data)
        if affected >= 0:
            updated_recipe = self.recipe_model.get_by_id(recipe_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.recipe_model.to_dict(updated_recipe)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete(self, recipe_id: int, user_id: int) -> Dict[str, Any]:
        recipe = self.recipe_model.get_by_id(recipe_id)
        if not recipe:
            return {
                'code': 1,
                'msg': '食谱不存在',
                'data': None
            }

        if recipe.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限删除',
                'data': None
            }

        affected = self.recipe_model.delete(recipe_id)
        if affected > 0:
            self.user_model.increment_recipe_count(user_id, -1)
            self.category_model.increment_recipe_count(recipe.get('category_id'), -1)
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

    def get_by_id(self, recipe_id: int, increment_view: bool = True) -> Dict[str, Any]:
        recipe = self.recipe_model.get_by_id(recipe_id)
        if not recipe:
            return {
                'code': 1,
                'msg': '食谱不存在',
                'data': None
            }

        if increment_view:
            self.recipe_model.increment_view_count(recipe_id)

        recipe_dict = self.recipe_model.to_dict(recipe)
        user = self.user_model.get_by_id(recipe.get('user_id'))
        if user:
            recipe_dict['author'] = {
                'id': user.get('id'),
                'nickname': user.get('nickname'),
                'avatar': user.get('avatar')
            }

        category = self.category_model.get_by_id(recipe.get('category_id'))
        if category:
            recipe_dict['category_name'] = category.get('name')

        return {
            'code': 0,
            'msg': 'success',
            'data': recipe_dict
        }

    def get_list(self, page: int = 1, page_size: int = 10,
                 category_id: int = None, status: int = None,
                 keyword: str = None, difficulty: str = None,
                 order_by: str = 'created_at DESC') -> Dict[str, Any]:
        result = self.recipe_model.get_list(page, page_size, category_id, status, keyword, difficulty, order_by)
        items = [self._enrich_recipe(item) for item in result.get('items', [])]

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

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.recipe_model.get_by_user(user_id, page, page_size, status)
        items = [self._enrich_recipe(item) for item in result.get('items', [])]

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

    def _enrich_recipe(self, recipe: Dict[str, Any]) -> Dict[str, Any]:
        recipe_dict = self.recipe_model.to_dict(recipe)
        user = self.user_model.get_by_id(recipe.get('user_id'))
        if user:
            recipe_dict['author'] = {
                'id': user.get('id'),
                'nickname': user.get('nickname'),
                'avatar': user.get('avatar')
            }
        return recipe_dict

    def update_status(self, recipe_id: int, status: int) -> Dict[str, Any]:
        recipe = self.recipe_model.get_by_id(recipe_id)
        if not recipe:
            return {
                'code': 1,
                'msg': '食谱不存在',
                'data': None
            }

        affected = self.recipe_model.update_status(recipe_id, status)
        if affected > 0:
            updated_recipe = self.recipe_model.get_by_id(recipe_id)
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': self.recipe_model.to_dict(updated_recipe)
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }

    def approve(self, recipe_id: int) -> Dict[str, Any]:
        return self.update_status(recipe_id, self.recipe_model.STATUS_APPROVED)

    def reject(self, recipe_id: int) -> Dict[str, Any]:
        return self.update_status(recipe_id, self.recipe_model.STATUS_REJECTED)

    def get_statistics(self) -> Dict[str, Any]:
        stats = self.recipe_model.get_statistics()
        return {
            'code': 0,
            'msg': 'success',
            'data': stats
        }
