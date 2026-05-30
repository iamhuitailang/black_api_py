from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateCategoryRequest(BaseModel):
    name: str = Field(..., description="分类名称")
    icon: Optional[str] = Field('', description="图标")
    description: Optional[str] = Field('', description="描述")
    sort_order: Optional[int] = Field(0, description="排序")


class UpdateCategoryRequest(BaseModel):
    name: Optional[str] = Field(None, description="分类名称")
    icon: Optional[str] = Field(None, description="图标")
    description: Optional[str] = Field(None, description="描述")
    sort_order: Optional[int] = Field(None, description="排序")
    status: Optional[int] = Field(None, description="状态")


class BqCategoryController:
    def __init__(self):
        from app.business.biaoqing_model.category_business import BqCategoryBusiness
        self.category_business = BqCategoryBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.biaoqing_model.user_business import BqUserBusiness
        user_business = BqUserBusiness()
        return user_business.verify_token(token)

    def ActionBqCategoryCreatePost(self, request: Request, body: CreateCategoryRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        创建分类接口（管理员）
        POST /api/bq/category/create
        创建新的分类
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.category_business.create(
            name=body.name,
            icon=body.icon or '',
            description=body.description or '',
            sort_order=body.sort_order or 0
        )

    def ActionBqCategoryUpdatePost(self, request: Request, body: UpdateCategoryRequest,
                                    category_id: int = Query(..., description="分类ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        更新分类接口（管理员）
        POST /api/bq/category/update
        更新分类信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.icon is not None:
            data['icon'] = body.icon
        if body.description is not None:
            data['description'] = body.description
        if body.sort_order is not None:
            data['sort_order'] = body.sort_order
        if body.status is not None:
            data['status'] = body.status

        return self.category_business.update(
            category_id=category_id,
            data=data
        )

    def ActionBqCategoryDeletePost(self, request: Request, category_id: int = Query(..., description="分类ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        删除分类接口（管理员）
        POST /api/bq/category/delete
        删除指定分类
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.category_business.delete(category_id)

    def ActionBqCategoryDetailGet(self, request: Request, category_id: int = Query(..., description="分类ID")):
        """
        获取分类详情接口
        GET /api/bq/category/detail/get
        根据ID获取分类详情
        """
        return self.category_business.get_by_id(category_id)

    def ActionBqCategoryAllGet(self, request: Request, include_disabled: bool = Query(False, description="是否包含禁用")):
        """
        获取所有分类接口
        GET /api/bq/category/all/get
        获取所有分类列表
        """
        return self.category_business.get_all(include_disabled=include_disabled)

    def ActionBqCategoryListGet(self, request: Request, page: int = Query(1, description="页码"),
                                 page_size: int = Query(20, description="每页数量"),
                                 status: Optional[int] = Query(None, description="状态"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取分类列表接口（管理员）
        GET /api/bq/category/list/get
        分页获取分类列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.category_business.get_list(
            page=page,
            page_size=page_size,
            status=status
        )
