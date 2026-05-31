from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateRecipeRequest(BaseModel):
    category_id: int = Field(..., description="分类ID")
    title: str = Field(..., description="食谱标题")
    cover_image: Optional[str] = Field('', description="封面图片")
    description: Optional[str] = Field('', description="食谱描述")
    ingredients: Optional[List] = Field([], description="食材列表")
    steps: Optional[List] = Field([], description="步骤列表")
    tips: Optional[str] = Field('', description="小贴士")
    cook_time: Optional[int] = Field(0, description="烹饪时间(分钟)")
    servings: Optional[int] = Field(1, description="份量")
    difficulty: Optional[str] = Field('easy', description="难度")


class UpdateRecipeRequest(BaseModel):
    category_id: Optional[int] = Field(None, description="分类ID")
    title: Optional[str] = Field(None, description="食谱标题")
    cover_image: Optional[str] = Field(None, description="封面图片")
    description: Optional[str] = Field(None, description="食谱描述")
    ingredients: Optional[List] = Field(None, description="食材列表")
    steps: Optional[List] = Field(None, description="步骤列表")
    tips: Optional[str] = Field(None, description="小贴士")
    cook_time: Optional[int] = Field(None, description="烹饪时间(分钟)")
    servings: Optional[int] = Field(None, description="份量")
    difficulty: Optional[str] = Field(None, description="难度")


class ShipuRecipeController:
    def __init__(self):
        from app.business.shipu.recipe_business import ShipuRecipeBusiness
        from app.business.shipu.user_business import ShipuUserBusiness
        self.recipe_business = ShipuRecipeBusiness()
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

    def ActionShipuRecipeCreatePost(self, request: Request, body: CreateRecipeRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        创建食谱接口
        POST /api/shipu/recipe/create
        用户发布新食谱
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.recipe_business.create(
            user_id=user.get('id'),
            category_id=body.category_id,
            title=body.title,
            cover_image=body.cover_image or '',
            description=body.description or '',
            ingredients=body.ingredients or [],
            steps=body.steps or [],
            tips=body.tips or '',
            cook_time=body.cook_time or 0,
            servings=body.servings or 1,
            difficulty=body.difficulty or 'easy'
        )

    async def ActionShipuRecipeUpdatePost(self, request: Request, recipe_id: int = Query(..., description="食谱ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        更新食谱接口
        POST /api/shipu/recipe/update
        用户更新自己的食谱
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

        return self.recipe_business.update(
            recipe_id=recipe_id,
            user_id=user.get('id'),
            data=body
        )

    def ActionShipuRecipeDeletePost(self, request: Request, recipe_id: int = Query(..., description="食谱ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        删除食谱接口
        POST /api/shipu/recipe/delete
        用户删除自己的食谱
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.recipe_business.delete(recipe_id, user.get('id'))

    def ActionShipuRecipeDetailGet(self, request: Request, recipe_id: int = Query(..., description="食谱ID"),
                                   increment_view: bool = Query(True, description="是否增加浏览量")):
        """
        获取食谱详情接口
        GET /api/shipu/recipe/detail/get
        根据食谱ID获取食谱详情
        """
        return self.recipe_business.get_by_id(recipe_id, increment_view)

    def ActionShipuRecipeListGet(self, request: Request, page: int = Query(1, description="页码"),
                                 page_size: int = Query(10, description="每页数量"),
                                 category_id: Optional[int] = Query(None, description="分类ID"),
                                 keyword: Optional[str] = Query(None, description="搜索关键词"),
                                 difficulty: Optional[str] = Query(None, description="难度"),
                                 order_by: str = Query('created_at DESC', description="排序")):
        """
        获取食谱列表接口
        GET /api/shipu/recipe/list/get
        分页获取已审核通过的食谱列表
        """
        from app.model.shipu_077_model.recipe import RecipeModel
        return self.recipe_business.get_list(
            page=page,
            page_size=page_size,
            category_id=category_id,
            status=RecipeModel.STATUS_APPROVED,
            keyword=keyword,
            difficulty=difficulty,
            order_by=order_by
        )

    def ActionShipuRecipeMyGet(self, request: Request, page: int = Query(1, description="页码"),
                               page_size: int = Query(10, description="每页数量"),
                               status: Optional[int] = Query(None, description="状态"),
                               authorization: Optional[str] = Header(None)):
        """
        获取我的食谱接口
        GET /api/shipu/recipe/my/get
        获取当前用户发布的食谱
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.recipe_business.get_by_user(user.get('id'), page, page_size, status)
