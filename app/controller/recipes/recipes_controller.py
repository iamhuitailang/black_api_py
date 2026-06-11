from typing import Optional, List
from fastapi import APIRouter, Query, Request, Header
from pydantic import BaseModel, Field
from app.business.recipes import RecipeBusiness
from app.business.auth import AuthBusiness


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
        self.auth_business = AuthBusiness()

    def _get_user(self, request: Request, authorization: Optional[str] = None):
        token = ''
        if authorization and authorization.startswith('Bearer '):
            token = authorization[7:]
        
        if not token:
            token = request.query_params.get('token', '')

        if not token:
            return None

        return self.auth_business.verify_token(token)

    def ActionRecipesGet(self, request: Request, id: Optional[int] = Query(None),
                          authorization: Optional[str] = Header(None)):
        user = self._get_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}

        if id:
            return self.business.get_recipe(user['id'], id)
        return self.business.get_all_recipes(user['id'])

    def ActionRecipesGetlist(self, request: Request,
                              difficulty: Optional[str] = Query(None),
                              tag: Optional[str] = Query(None),
                              keyword: Optional[str] = Query(None),
                              authorization: Optional[str] = Header(None)):
        user = self._get_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}

        return self.business.get_all_recipes(user['id'], difficulty, tag, keyword)

    def ActionRecipesSet(self, request: Request, body: RecipeCreateRequest,
                          authorization: Optional[str] = Header(None)):
        user = self._get_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}

        ingredients = [{'name': i.name, 'amount': i.amount} for i in body.ingredients]
        return self.business.create_recipe(
            user_id=user['id'],
            name=body.name,
            difficulty=body.difficulty,
            cook_time=body.cook_time,
            tags=body.tags,
            steps=body.steps,
            ingredients=ingredients
        )

    def ActionRecipesPut(self, request: Request, body: RecipeUpdateRequest,
                          authorization: Optional[str] = Header(None)):
        user = self._get_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}

        ingredients = [{'name': i.name, 'amount': i.amount} for i in body.ingredients]
        return self.business.update_recipe(
            user_id=user['id'],
            recipe_id=body.id,
            name=body.name,
            difficulty=body.difficulty,
            cook_time=body.cook_time,
            tags=body.tags,
            steps=body.steps,
            ingredients=ingredients
        )

    def ActionRecipesDelete(self, request: Request, id: int = Query(..., ge=1),
                             authorization: Optional[str] = Header(None)):
        user = self._get_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}

        return self.business.delete_recipe(user['id'], id)

    def ActionRecipesSearchbyingredientsPost(self, request: Request,
                                              body: SearchByIngredientsRequest,
                                              authorization: Optional[str] = Header(None)):
        user = self._get_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}

        return self.business.search_by_ingredients(user['id'], body.ingredients)

    def ActionRecipesShoppinglistPost(self, request: Request,
                                       body: GenerateShoppingListRequest,
                                       authorization: Optional[str] = Header(None)):
        user = self._get_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}

        return self.business.generate_shopping_list(user['id'], body.recipe_ids)

    def ActionRecipesTogglefavoritePost(self, request: Request,
                                         body: ToggleFavoriteRequest,
                                         authorization: Optional[str] = Header(None)):
        user = self._get_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}

        return self.business.toggle_favorite(user['id'], body.recipe_id)

    def ActionRecipesGetfavoritesGet(self, request: Request,
                                      authorization: Optional[str] = Header(None)):
        user = self._get_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}

        return self.business.get_favorites(user['id'])

    def ActionRecipesGetallingredientsGet(self, request: Request,
                                           authorization: Optional[str] = Header(None)):
        user = self._get_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}

        return self.business.get_all_ingredient_names(user['id'])
