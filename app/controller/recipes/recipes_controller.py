from typing import Optional, List
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field
from app.business.recipes import RecipeBusiness


class IngredientItem(BaseModel):
    name: str
    amount: Optional[str] = ""


class RecipeCreateRequest(BaseModel):
    name: str
    difficulty: str = "简单"
    cook_time: int = Field(..., ge=0, description="烹饪时间(分钟)")
    tags: List[str] = []
    steps: List[str] = []
    ingredients: List[IngredientItem] = []


class RecipeUpdateRequest(BaseModel):
    id: int
    name: str
    difficulty: str = "简单"
    cook_time: int = Field(..., ge=0, description="烹饪时间(分钟)")
    tags: List[str] = []
    steps: List[str] = []
    ingredients: List[IngredientItem] = []


class SearchByIngredientsRequest(BaseModel):
    ingredients: List[str] = []


class GenerateShoppingListRequest(BaseModel):
    recipe_ids: List[int] = []


class ToggleFavoriteRequest(BaseModel):
    recipe_id: int


class RecipesController:
    def __init__(self):
        self.business = RecipeBusiness()

    def ActionRecipesGet(self, request: Request, id: Optional[int] = Query(None)):
        """
        获取菜谱详情或全部列表
        GET /api/recipes/get
        参数: id (可选) - 指定获取某条菜谱
        """
        if id:
            return self.business.get_recipe(id)
        return self.business.get_all_recipes()

    def ActionRecipesGetlist(self, request: Request,
                              difficulty: Optional[str] = Query(None),
                              tag: Optional[str] = Query(None),
                              keyword: Optional[str] = Query(None)):
        """
        获取菜谱列表（支持按难度、标签、关键词筛选）
        GET /api/recipes/getlist
        """
        return self.business.get_all_recipes(difficulty, tag, keyword)

    def ActionRecipesSet(self, request: Request, body: RecipeCreateRequest):
        """
        创建菜谱
        POST /api/recipes/set
        """
        ingredients = [{'name': i.name, 'amount': i.amount} for i in body.ingredients]
        return self.business.create_recipe(
            name=body.name,
            difficulty=body.difficulty,
            cook_time=body.cook_time,
            tags=body.tags,
            steps=body.steps,
            ingredients=ingredients
        )

    def ActionRecipesPut(self, request: Request, body: RecipeUpdateRequest):
        """
        更新菜谱
        PUT /api/recipes/put
        """
        ingredients = [{'name': i.name, 'amount': i.amount} for i in body.ingredients]
        return self.business.update_recipe(
            recipe_id=body.id,
            name=body.name,
            difficulty=body.difficulty,
            cook_time=body.cook_time,
            tags=body.tags,
            steps=body.steps,
            ingredients=ingredients
        )

    def ActionRecipesDelete(self, request: Request, id: int = Query(..., ge=1)):
        """
        删除菜谱
        DELETE /api/recipes/delete
        """
        return self.business.delete_recipe(id)

    def ActionRecipesSearchbyingredientsPost(self, request: Request, body: SearchByIngredientsRequest):
        """
        按食材搜索菜谱（按匹配度排序）
        POST /api/recipes/searchbyingredients/post
        请求体: { ingredients: ["番茄", "鸡蛋"] }
        """
        return self.business.search_by_ingredients(body.ingredients)

    def ActionRecipesShoppinglistPost(self, request: Request, body: GenerateShoppingListRequest):
        """
        生成购物清单（根据菜谱ID列表，汇总去重）
        POST /api/recipes/shoppinglist/post
        请求体: { recipe_ids: [1, 2, 3] }
        """
        return self.business.generate_shopping_list(body.recipe_ids)

    def ActionRecipesTogglefavoritePost(self, request: Request, body: ToggleFavoriteRequest):
        """
        收藏/取消收藏菜谱
        POST /api/recipes/togglefavorite/post
        请求体: { recipe_id: 1 }
        """
        return self.business.toggle_favorite(body.recipe_id)

    def ActionRecipesGetfavoritesGet(self, request: Request):
        """
        获取收藏列表
        GET /api/recipes/getfavorites/get
        """
        return self.business.get_favorites()

    def ActionRecipesGetallingredientsGet(self, request: Request):
        """
        获取所有已录入的食材名称（用于自动补全）
        GET /api/recipes/getallingredients/get
        """
        return self.business.get_all_ingredient_names()
