from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateCategoryRequest(BaseModel):
    name: str = Field(..., description="分类名称")
    code: str = Field(..., description="分类编码")
    description: Optional[str] = Field('', description="描述")
    sort_order: Optional[int] = Field(0, description="排序")


class UpdateCategoryRequest(BaseModel):
    name: Optional[str] = Field(None, description="分类名称")
    code: Optional[str] = Field(None, description="分类编码")
    description: Optional[str] = Field(None, description="描述")
    sort_order: Optional[int] = Field(None, description="排序")
    status: Optional[int] = Field(None, description="状态")


class TousuCategoryController:
    def __init__(self):
        from app.business.tousu.category_business import TousuCategoryBusiness
        self.category_business = TousuCategoryBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.tousu.user_business import TousuUserBusiness
        user_business = TousuUserBusiness()
        return user_business.verify_token(token)

    def ActionTousuCategoryCreatePost(self, request: Request, body: CreateCategoryRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        创建分类接口
        POST /api/tousu/category/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '权限不足',
                'data': None
            }

        return self.category_business.create_category(
            name=body.name,
            code=body.code,
            description=body.description or '',
            sort_order=body.sort_order or 0
        )

    def ActionTousuCategoryUpdatePost(self, request: Request, body: UpdateCategoryRequest,
                                      category_id: int = Query(..., description="分类ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        更新分类接口
        POST /api/tousu/category/update
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '权限不足',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.code is not None:
            data['code'] = body.code
        if body.description is not None:
            data['description'] = body.description
        if body.sort_order is not None:
            data['sort_order'] = body.sort_order
        if body.status is not None:
            data['status'] = body.status

        return self.category_business.update_category(category_id, data)

    def ActionTousuCategoryDeletePost(self, request: Request,
                                      category_id: int = Query(..., description="分类ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        删除分类接口
        POST /api/tousu/category/delete
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '权限不足',
                'data': None
            }

        return self.category_business.delete_category(category_id)

    def ActionTousuCategoryDetailGet(self, request: Request,
                                     category_id: int = Query(..., description="分类ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取分类详情接口
        GET /api/tousu/category/detail/get
        """
        return self.category_business.get_category(category_id)

    def ActionTousuCategoryListGet(self, request: Request,
                                   status: Optional[int] = Query(None, description="状态"),
                                   keyword: Optional[str] = Query(None, description="关键词"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取分类列表接口
        GET /api/tousu/category/list/get
        """
        return self.category_business.get_all_categories(status, keyword)