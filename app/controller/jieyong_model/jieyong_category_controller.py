from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateCategoryRequest(BaseModel):
    name: str = Field(..., description="分类名称")
    description: Optional[str] = Field('', description="分类描述")
    sort_order: Optional[int] = Field(0, description="排序")


class UpdateCategoryRequest(BaseModel):
    category_id: int = Field(..., description="分类ID")
    name: Optional[str] = Field(None, description="分类名称")
    description: Optional[str] = Field(None, description="分类描述")
    sort_order: Optional[int] = Field(None, description="排序")
    status: Optional[int] = Field(None, description="状态")


class JieyongCategoryController:
    def __init__(self):
        from app.business.jieyong_model.category_business import JieyongCategoryBusiness
        from app.business.jieyong_model.auth_business import JieyongAuthBusiness
        self.category_business = JieyongCategoryBusiness()
        self.auth_business = JieyongAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def _require_admin(self, token: str) -> Optional[dict]:
        user = self._get_current_user(token)
        if not user:
            return None
        if not self.auth_business.is_admin(user.get('id')):
            return None
        return user

    def ActionJieyongCategoryCreatePost(self, request: Request, body: CreateCategoryRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        创建分类接口（管理员）
        POST /api/jieyong_model/category/create
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)
        if not admin:
            return {'code': 1, 'msg': '无权限访问', 'data': None}

        return self.category_business.create(
            name=body.name,
            description=body.description or '',
            sort_order=body.sort_order or 0
        )

    def ActionJieyongCategoryUpdatePost(self, request: Request, body: UpdateCategoryRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        更新分类接口（管理员）
        POST /api/jieyong_model/category/update
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)
        if not admin:
            return {'code': 1, 'msg': '无权限访问', 'data': None}

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.description is not None:
            data['description'] = body.description
        if body.sort_order is not None:
            data['sort_order'] = body.sort_order
        if body.status is not None:
            data['status'] = body.status

        return self.category_business.update(body.category_id, data)

    def ActionJieyongCategoryDeletePost(self, request: Request, category_id: int = Query(..., description="分类ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        删除分类接口（管理员）
        POST /api/jieyong_model/category/delete
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)
        if not admin:
            return {'code': 1, 'msg': '无权限访问', 'data': None}

        return self.category_business.delete(category_id)

    def ActionJieyongCategoryDetailGet(self, request: Request, category_id: int = Query(..., description="分类ID")):
        """
        获取分类详情接口
        GET /api/jieyong_model/category/detail/get
        """
        return self.category_business.get_by_id(category_id)

    def ActionJieyongCategoryListGet(self, request: Request,
                                      page: int = Query(1, description="页码"),
                                      page_size: int = Query(10, description="每页数量"),
                                      status: Optional[int] = Query(None, description="状态"),
                                      keyword: Optional[str] = Query(None, description="关键词"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取分类列表接口（管理员）
        GET /api/jieyong_model/category/list/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)
        if not admin:
            return {'code': 1, 'msg': '无权限访问', 'data': None}

        return self.category_business.get_list(page, page_size, status, keyword)

    def ActionJieyongCategoryAllGet(self, request: Request):
        """
        获取所有启用分类接口
        GET /api/jieyong_model/category/all/get
        """
        return self.category_business.get_all_active()
