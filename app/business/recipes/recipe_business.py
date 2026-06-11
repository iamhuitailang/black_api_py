from typing import Dict, Any, List, Optional
from app.model.recipes import RecipeModel, IngredientModel, FavoriteModel


class RecipeBusiness:
    def __init__(self):
        self.recipe_model = RecipeModel()
        self.ingredient_model = IngredientModel()
        self.favorite_model = FavoriteModel()

    def _enrich_recipe(self, user_id: int, recipe: Dict[str, Any]) -> Dict[str, Any]:
        if not recipe:
            return recipe
        recipe_id = recipe.get('id')
        recipe['ingredients'] = self.ingredient_model.get_by_recipe_id(recipe_id)
        recipe['is_favorited'] = self.favorite_model.is_favorited(user_id, recipe_id)
        return recipe

    def get_recipe(self, user_id: int, recipe_id: int) -> Dict[str, Any]:
        recipe = self.recipe_model.get_with_ingredients(user_id, recipe_id)
        if not recipe:
            return {
                'code': 1,
                'message': f'Recipe with id {recipe_id} not found',
                'data': None
            }
        recipe['is_favorited'] = self.favorite_model.is_favorited(user_id, recipe_id)
        return {
            'code': 0,
            'message': 'success',
            'data': recipe
        }

    def get_all_recipes(self, user_id: int, difficulty: str = None, tag: str = None,
                        keyword: str = None) -> Dict[str, Any]:
        recipes = self.recipe_model.get_all(user_id, difficulty, tag, keyword)
        enriched = [self._enrich_recipe(user_id, r) for r in recipes]
        return {
            'code': 0,
            'message': 'success',
            'data': enriched
        }

    def create_recipe(self, user_id: int, name: str, difficulty: str, cook_time: int,
                      tags: List[str], steps: List[str],
                      ingredients: List[Dict[str, str]]) -> Dict[str, Any]:
        if not name or not name.strip():
            return {
                'code': 1,
                'message': '菜名不能为空',
                'data': None
            }

        valid_difficulties = ['简单', '中等', '复杂']
        if difficulty not in valid_difficulties:
            return {
                'code': 1,
                'message': f'难度必须是: {"/".join(valid_difficulties)}',
                'data': None
            }

        valid_tags = ['家常菜', '快手菜', '硬菜', '甜品', '汤']
        for t in tags:
            if t not in valid_tags:
                return {
                    'code': 1,
                    'message': f'标签必须是: {"/".join(valid_tags)}',
                    'data': None
                }

        if not ingredients:
            return {
                'code': 1,
                'message': '食材列表不能为空',
                'data': None
            }

        for ing in ingredients:
            if not ing.get('name') or not ing['name'].strip():
                return {
                    'code': 1,
                    'message': '食材名称不能为空',
                    'data': None
                }

        if not steps:
            return {
                'code': 1,
                'message': '步骤列表不能为空',
                'data': None
            }

        name = name.strip()
        cleaned_ings = [{'name': i['name'].strip(), 'amount': i.get('amount', '').strip()} for i in ingredients]
        cleaned_steps = [s.strip() for s in steps if s and s.strip()]

        recipe_id = self.recipe_model.create(user_id, name, difficulty, cook_time, tags, cleaned_steps, cleaned_ings)
        recipe = self.recipe_model.get_with_ingredients(user_id, recipe_id)
        recipe['is_favorited'] = False
        return {
            'code': 0,
            'message': '创建成功',
            'data': recipe
        }

    def update_recipe(self, user_id: int, recipe_id: int, name: str, difficulty: str, cook_time: int,
                      tags: List[str], steps: List[str],
                      ingredients: List[Dict[str, str]]) -> Dict[str, Any]:
        existing = self.recipe_model.get_by_id(user_id, recipe_id)
        if not existing:
            return {
                'code': 1,
                'message': f'Recipe with id {recipe_id} not found',
                'data': None
            }

        if not name or not name.strip():
            return {
                'code': 1,
                'message': '菜名不能为空',
                'data': None
            }

        valid_difficulties = ['简单', '中等', '复杂']
        if difficulty not in valid_difficulties:
            return {
                'code': 1,
                'message': f'难度必须是: {"/".join(valid_difficulties)}',
                'data': None
            }

        valid_tags = ['家常菜', '快手菜', '硬菜', '甜品', '汤']
        for t in tags:
            if t not in valid_tags:
                return {
                    'code': 1,
                    'message': f'标签必须是: {"/".join(valid_tags)}',
                    'data': None
                }

        if not ingredients:
            return {
                'code': 1,
                'message': '食材列表不能为空',
                'data': None
            }

        if not steps:
            return {
                'code': 1,
                'message': '步骤列表不能为空',
                'data': None
            }

        name = name.strip()
        cleaned_ings = [{'name': i['name'].strip(), 'amount': i.get('amount', '').strip()} for i in ingredients]
        cleaned_steps = [s.strip() for s in steps if s and s.strip()]

        self.recipe_model.update(user_id, recipe_id, name, difficulty, cook_time, tags, cleaned_steps, cleaned_ings)
        recipe = self.recipe_model.get_with_ingredients(user_id, recipe_id)
        recipe['is_favorited'] = self.favorite_model.is_favorited(user_id, recipe_id)
        return {
            'code': 0,
            'message': '更新成功',
            'data': recipe
        }

    def delete_recipe(self, user_id: int, recipe_id: int) -> Dict[str, Any]:
        existing = self.recipe_model.get_by_id(user_id, recipe_id)
        if not existing:
            return {
                'code': 1,
                'message': f'Recipe with id {recipe_id} not found',
                'data': None
            }

        self.recipe_model.delete(user_id, recipe_id)
        return {
            'code': 0,
            'message': '删除成功',
            'data': None
        }

    def search_by_ingredients(self, user_id: int, ingredient_names: List[str]) -> Dict[str, Any]:
        if not ingredient_names:
            return {
                'code': 1,
                'message': '请输入至少一个食材',
                'data': None
            }

        cleaned_names = list(set([n.strip() for n in ingredient_names if n and n.strip()]))
        if not cleaned_names:
            return {
                'code': 1,
                'message': '请输入有效的食材名称',
                'data': None
            }

        results = self.recipe_model.search_by_ingredients(user_id, cleaned_names)
        enriched = [self._enrich_recipe(user_id, r) for r in results]
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'searched_ingredients': cleaned_names,
                'results': enriched
            }
        }

    def generate_shopping_list(self, user_id: int, recipe_ids: List[int]) -> Dict[str, Any]:
        if not recipe_ids:
            return {
                'code': 1,
                'message': '请选择至少一个菜谱',
                'data': None
            }

        valid_ids = list(set(recipe_ids))
        valid_existing = []
        for rid in valid_ids:
            r = self.recipe_model.get_by_id(user_id, rid)
            if r:
                valid_existing.append(r)

        if not valid_existing:
            return {
                'code': 1,
                'message': '没有找到有效的菜谱',
                'data': None
            }

        shopping_items = self.ingredient_model.generate_shopping_list([r['id'] for r in valid_existing])
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'recipes': valid_existing,
                'shopping_list': shopping_items
            }
        }

    def toggle_favorite(self, user_id: int, recipe_id: int) -> Dict[str, Any]:
        existing = self.recipe_model.get_by_id(user_id, recipe_id)
        if not existing:
            return {
                'code': 1,
                'message': f'Recipe with id {recipe_id} not found',
                'data': None
            }

        is_fav = self.favorite_model.is_favorited(user_id, recipe_id)
        if is_fav:
            self.favorite_model.remove(user_id, recipe_id)
            return {
                'code': 0,
                'message': '已取消收藏',
                'data': {'is_favorited': False, 'recipe_id': recipe_id}
            }
        else:
            self.favorite_model.add(user_id, recipe_id)
            return {
                'code': 0,
                'message': '已收藏',
                'data': {'is_favorited': True, 'recipe_id': recipe_id}
            }

    def get_favorites(self, user_id: int) -> Dict[str, Any]:
        favorites = self.favorite_model.get_all(user_id)
        for fav in favorites:
            fav['ingredients'] = self.ingredient_model.get_by_recipe_id(fav['recipe_id'])
            fav['is_favorited'] = True
        return {
            'code': 0,
            'message': 'success',
            'data': favorites
        }

    def get_all_ingredient_names(self, user_id: int) -> Dict[str, Any]:
        recipes = self.recipe_model.get_all(user_id)
        recipe_ids = [r['id'] for r in recipes]
        if not recipe_ids:
            return {
                'code': 0,
                'message': 'success',
                'data': []
            }

        placeholders = ','.join(['?' for _ in recipe_ids])
        sql = f"""
            SELECT DISTINCT name FROM ingredients
            WHERE recipe_id IN ({placeholders})
            ORDER BY name
        """
        from app.common.sqlite.db import get_db
        db = get_db()
        rows = db.fetch_all(sql, tuple(recipe_ids))
        names = [r['name'] for r in rows]
        return {
            'code': 0,
            'message': 'success',
            'data': names
        }
