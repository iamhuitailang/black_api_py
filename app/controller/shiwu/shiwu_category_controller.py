from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateCategoryRequest(BaseModel):
    name: str = Field(..., description="分类名称")
    code: str = Field(..., description="分类编码")
    icon: Optional[str] = Field(None, description="图标")
    color: Optional[str] = Field(None, description="颜色")
    sort_order: Optional[int] = Field(0, description="排序")


class UpdateCategoryRequest(BaseModel):
    name: Optional[str] = Field(None, description="分类名称")
    code: Optional[str] = Field(None, description="分类编码")
    icon: Optional[str] = Field(None, description="图标")
    color: Optional[str] = Field(None, description="颜色")
    sort_order: Optional[int] = Field(None, description="排序")
    status: Optional[int] = Field(None, description="状态")


class ShiwuCategoryController:
    def __init__(self):
        from app.business.shiwu.category_business import CategoryBusiness
        from app.business.shiwu.admin_business import AdminBusiness
        self.category_business = CategoryBusiness()
        self.admin_business = AdminBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionShiwuCategoryListGet(self, request: Request):
        """
        获取分类列表接口
        GET /api/shiwu/category/list/get
        获取所有启用的分类
        """
        return self.category_business.get_category_list()

    def ActionShiwuCategoryAllGet(self, request: Request,
                                   page: int = Query(1, ge=1, description="页码"),
                                   page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                   status: Optional[int] = Query(None, description="状态"),
                                   authorization: Optional[str] = Header(None)):
        """
        管理员获取全部分类接口
        GET /api/shiwu/category/all/get
        分页获取所有分类（含禁用）
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.category_business.get_all_categories(
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionShiwuCategoryDetailGet(self, request: Request,
                                      category_id: int = Query(..., description="分类ID")):
        """
        获取分类详情接口
        GET /api/shiwu/category/detail/get
        根据分类ID获取详情
        """
        return self.category_business.get_category_by_id(category_id)

    def ActionShiwuCategoryCreatePost(self, request: Request, body: CreateCategoryRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        创建分类接口
        POST /api/shiwu/category/create
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
            name=body.name,
            code=body.code,
            icon=body.icon or '',
            color=body.color or '',
            sort_order=body.sort_order or 0
        )

    def ActionShiwuCategoryUpdatePost(self, request: Request,
                                       category_id: int = Query(..., description="分类ID"),
                                       body: UpdateCategoryRequest = None,
                                       authorization: Optional[str] = Header(None)):
        """
        更新分类接口
        POST /api/shiwu/category/update
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
        if body.code is not None:
            data['code'] = body.code
        if body.icon is not None:
            data['icon'] = body.icon
        if body.color is not None:
            data['color'] = body.color
        if body.sort_order is not None:
            data['sort_order'] = body.sort_order
        if body.status is not None:
            data['status'] = body.status

        return self.category_business.update_category(
            category_id=category_id,
            data=data
        )

    def ActionShiwuCategoryDeletePost(self, request: Request,
                                       category_id: int = Query(..., description="分类ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        删除分类接口
        POST /api/shiwu/category/delete
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
