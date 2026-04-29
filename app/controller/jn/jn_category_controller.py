from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateCategoryRequest(BaseModel):
    code: str = Field(..., description="分类编码")
    name: str = Field(..., description="分类名称")
    parent_code: Optional[str] = Field('', description="父分类编码")
    description: Optional[str] = Field('', description="分类描述")


class UpdateCategoryRequest(BaseModel):
    name: Optional[str] = Field(None, description="分类名称")
    description: Optional[str] = Field(None, description="分类描述")
    is_active: Optional[int] = Field(None, description="是否启用")


class JnCategoryController:
    def __init__(self):
        from app.business.jn.category_business import JnCategoryBusiness
        from app.business.jn.admin_business import JnAdminBusiness
        self.category_business = JnCategoryBusiness()
        self.admin_business = JnAdminBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionJnCategoryTreeGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取分类树接口
        GET /api/jn/category/tree/get
        获取所有分类的树形结构（用户端使用）
        """
        return self.category_business.get_category_tree()

    def ActionJnCategoryParentsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取父分类列表接口
        GET /api/jn/category/parents/get
        获取所有一级分类
        """
        return self.category_business.get_parent_categories()

    def ActionJnCategoryChildrenGet(self, request: Request,
                                      parent_code: str = Query(..., description="父分类编码"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取子分类列表接口
        GET /api/jn/category/children/get
        根据父分类编码获取子分类列表
        """
        return self.category_business.get_children_categories(parent_code)

    def ActionJnCategoryAdminTreeGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取管理端分类树接口
        GET /api/jn/category/admin/tree/get
        获取所有分类的树形结构（管理端使用，包含禁用分类）
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.category_business.get_admin_category_tree()

    def ActionJnCategoryCreatePost(self, request: Request, body: CreateCategoryRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        创建分类接口
        POST /api/jn/category/create
        管理员创建新分类
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.category_business.create_category(
            code=body.code,
            name=body.name,
            parent_code=body.parent_code or '',
            description=body.description or ''
        )

    def ActionJnCategoryUpdatePost(self, request: Request, body: UpdateCategoryRequest,
                                     category_id: int = Query(..., description="分类ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        更新分类接口
        POST /api/jn/category/update
        管理员更新分类信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.description is not None:
            data['description'] = body.description
        if body.is_active is not None:
            data['is_active'] = body.is_active

        return self.category_business.update_category(category_id, data)

    def ActionJnCategoryDeletePost(self, request: Request,
                                     category_id: int = Query(..., description="分类ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        删除分类接口
        POST /api/jn/category/delete
        管理员删除分类
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.category_business.delete_category(category_id)
