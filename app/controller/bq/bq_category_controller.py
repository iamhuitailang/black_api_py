from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateCategoryRequest(BaseModel):
    name: str = Field(..., description="分类名称")
    color: Optional[str] = Field('#FFF9C4', description="分类颜色")


class UpdateCategoryRequest(BaseModel):
    name: Optional[str] = Field(None, description="分类名称")
    color: Optional[str] = Field(None, description="分类颜色")


class BqCategoryController:
    def __init__(self):
        from app.business.bq.category_business import BqCategoryBusiness
        self.category_business = BqCategoryBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.bq.user_business import BqUserBusiness
        user_business = BqUserBusiness()
        return user_business.verify_token(token)

    def ActionBqCategoryCreatePost(self, request: Request, body: CreateCategoryRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        创建分类接口
        POST /api/bq/category/create
        创建自定义分类
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.category_business.create(
            user_id=user.get('id'),
            name=body.name,
            color=body.color or '#FFF9C4'
        )

    def ActionBqCategoryDetailGet(self, request: Request, category_id: int = Query(..., description="分类ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取分类详情接口
        GET /api/bq/category/detail/get
        根据ID获取分类详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.category_business.get_by_id(user.get('id'), category_id)

    def ActionBqCategoryUpdatePost(self, request: Request, category_id: int = Query(..., description="分类ID"),
                                    body: UpdateCategoryRequest = None,
                                    authorization: Optional[str] = Header(None)):
        """
        更新分类接口
        POST /api/bq/category/update
        更新分类信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.color is not None:
            data['color'] = body.color

        return self.category_business.update(user.get('id'), category_id, data)

    def ActionBqCategoryDeletePost(self, request: Request, category_id: int = Query(..., description="分类ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        删除分类接口
        POST /api/bq/category/delete
        删除自定义分类
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.category_business.delete(user.get('id'), category_id)

    def ActionBqCategoryListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取分类列表接口
        GET /api/bq/category/list
        获取所有分类（包含默认分类）
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.category_business.get_list(user.get('id'))
