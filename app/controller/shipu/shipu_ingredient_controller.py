from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateIngredientListRequest(BaseModel):
    recipe_id: Optional[int] = Field(0, description="食谱ID")
    name: Optional[str] = Field('', description="清单名称")
    ingredients: Optional[List] = Field([], description="食材列表")


class UpdateIngredientListRequest(BaseModel):
    name: Optional[str] = Field(None, description="清单名称")
    ingredients: Optional[List] = Field(None, description="食材列表")
    is_completed: Optional[int] = Field(None, description="是否完成")


class ShipuIngredientController:
    def __init__(self):
        from app.business.shipu.ingredient_business import ShipuIngredientBusiness
        from app.business.shipu.user_business import ShipuUserBusiness
        self.ingredient_business = ShipuIngredientBusiness()
        self.user_business = ShipuUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionShipuIngredientCreatePost(self, request: Request, body: CreateIngredientListRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        创建食材清单接口
        POST /api/shipu/ingredient/create
        创建新的食材清单
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.ingredient_business.create(
            user_id=user.get('id'),
            recipe_id=body.recipe_id or 0,
            name=body.name or '',
            ingredients=body.ingredients or []
        )

    def ActionShipuIngredientGeneratePost(self, request: Request, recipe_id: int = Query(..., description="食谱ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        从食谱生成食材清单接口
        POST /api/shipu/ingredient/generate
        根据食谱自动生成食材清单
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.ingredient_business.create_from_recipe(user.get('id'), recipe_id)

    async def ActionShipuIngredientUpdatePost(self, request: Request, list_id: int = Query(..., description="清单ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        更新食材清单接口
        POST /api/shipu/ingredient/update
        更新食材清单内容
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        import json
        try:
            body = json.loads(await request.body())
        except:
            body = {}

        return self.ingredient_business.update(list_id, user.get('id'), body)

    def ActionShipuIngredientDeletePost(self, request: Request, list_id: int = Query(..., description="清单ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        删除食材清单接口
        POST /api/shipu/ingredient/delete
        删除食材清单
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.ingredient_business.delete(list_id, user.get('id'))

    def ActionShipuIngredientDetailGet(self, request: Request, list_id: int = Query(..., description="清单ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取食材清单详情接口
        GET /api/shipu/ingredient/detail/get
        获取食材清单详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.ingredient_business.get_by_id(list_id, user.get('id'))

    def ActionShipuIngredientMyGet(self, request: Request, page: int = Query(1, description="页码"),
                                   page_size: int = Query(10, description="每页数量"),
                                   is_completed: Optional[int] = Query(None, description="是否完成"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取我的食材清单接口
        GET /api/shipu/ingredient/my/get
        获取当前用户的食材清单列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.ingredient_business.get_by_user(user.get('id'), page, page_size, is_completed)
