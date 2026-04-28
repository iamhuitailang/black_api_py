from typing import Optional
from fastapi import APIRouter, Query, Request, Header
from pydantic import BaseModel, Field
from app.business.dj import DjCategoryBusiness, DjAuthBusiness


class CreateCategoryRequest(BaseModel):
    name: str = Field(..., description="分类名称")
    parent_id: Optional[int] = Field(0, description="父级ID 0表示一级")
    icon: Optional[str] = Field(None, description="图标")
    sort: Optional[int] = Field(0, description="排序")


class UpdateCategoryRequest(BaseModel):
    name: Optional[str] = Field(None, description="分类名称")
    parent_id: Optional[int] = Field(None, description="父级ID")
    icon: Optional[str] = Field(None, description="图标")
    sort: Optional[int] = Field(None, description="排序")


class DjCategoryController:
    def __init__(self):
        self.category_business = DjCategoryBusiness()
        self.auth_business = DjAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _verify_auth(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)
        if not user:
            return None
        return user

    def ActionDjCategoryCreatePost(self, request: Request, body: CreateCategoryRequest, authorization: Optional[str] = Header(None)):
        """
        创建分类接口
        POST /api/dj/category/create
        创建新分类
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {
            'name': body.name,
            'parent_id': body.parent_id,
            'icon': body.icon,
            'sort': body.sort
        }

        return self.category_business.create_category(data)

    def ActionDjCategoryListGet(self, request: Request):
        """
        获取分类列表接口
        GET /api/dj/category/list
        获取分类树形列表
        """
        return self.category_business.get_category_list()

    def ActionDjCategoryParentGet(self, request: Request):
        """
        获取一级分类接口
        GET /api/dj/category/parent
        获取一级分类列表
        """
        return self.category_business.get_parent_categories()

    def ActionDjCategoryDetailGet(self, request: Request, category_id: int = Query(..., description="分类ID")):
        """
        获取分类详情接口
        GET /api/dj/category/detail
        获取分类详细信息
        """
        return self.category_business.get_category_detail(category_id)

    def ActionDjCategoryUpdatePost(self, request: Request, body: UpdateCategoryRequest, category_id: int = Query(..., description="分类ID"), authorization: Optional[str] = Header(None)):
        """
        更新分类接口
        POST /api/dj/category/update
        更新分类信息
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.parent_id is not None:
            data['parent_id'] = body.parent_id
        if body.icon is not None:
            data['icon'] = body.icon
        if body.sort is not None:
            data['sort'] = body.sort

        return self.category_business.update_category(category_id, data)

    def ActionDjCategoryDeletePost(self, request: Request, category_id: int = Query(..., description="分类ID"), authorization: Optional[str] = Header(None)):
        """
        删除分类接口
        POST /api/dj/category/delete
        删除分类
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.category_business.delete_category(category_id)
