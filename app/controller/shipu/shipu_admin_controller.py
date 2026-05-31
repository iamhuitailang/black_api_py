from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class ShipuAdminController:
    def __init__(self):
        from app.business.shipu.admin_business import ShipuAdminBusiness
        from app.business.shipu.user_business import ShipuUserBusiness
        from app.business.shipu.recipe_business import ShipuRecipeBusiness
        from app.business.shipu.category_business import ShipuCategoryBusiness
        self.admin_business = ShipuAdminBusiness()
        self.user_business = ShipuUserBusiness()
        self.recipe_business = ShipuRecipeBusiness()
        self.category_business = ShipuCategoryBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionShipuAdminLoginPost(self, request: Request, body: AdminLoginRequest):
        """
        管理员登录接口
        POST /api/shipu/admin/login
        管理员账号密码登录
        """
        return self.admin_business.login(body.username, body.password)

    def ActionShipuAdminLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        管理员登出接口
        POST /api/shipu/admin/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.admin_business.logout(token)

    def ActionShipuAdminCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前管理员信息接口
        GET /api/shipu/admin/current/get
        根据token获取当前登录管理员信息
        """
        token = self._get_token_from_header(request, authorization)
        return self.admin_business.get_current_admin(token)

    def ActionShipuAdminUserListGet(self, request: Request, page: int = Query(1, description="页码"),
                                   page_size: int = Query(10, description="每页数量"),
                                   status: Optional[int] = Query(None, description="用户状态"),
                                   keyword: Optional[str] = Query(None, description="搜索关键词"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口
        GET /api/shipu/admin/user/list/get
        分页获取用户列表
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_list(page, page_size, status, keyword)

    def ActionShipuAdminUserStatusUpdatePost(self, request: Request,
                                            user_id: int = Query(..., description="用户ID"),
                                            status: int = Query(..., description="状态"),
                                            authorization: Optional[str] = Header(None)):
        """
        更新用户状态接口
        POST /api/shipu/admin/user/status/update
        禁用/启用用户账号
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.update_user_status(user_id, status)

    def ActionShipuAdminRecipeListGet(self, request: Request, page: int = Query(1, description="页码"),
                                      page_size: int = Query(10, description="每页数量"),
                                      status: Optional[int] = Query(None, description="状态"),
                                      keyword: Optional[str] = Query(None, description="搜索关键词"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取食谱列表接口（管理员）
        GET /api/shipu/admin/recipe/list/get
        分页获取食谱列表，支持状态筛选
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.recipe_business.get_list(page, page_size, None, status, keyword)

    def ActionShipuAdminRecipeApprovePost(self, request: Request,
                                         recipe_id: int = Query(..., description="食谱ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        审核通过食谱接口
        POST /api/shipu/admin/recipe/approve
        审核通过待审核的食谱
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.recipe_business.approve(recipe_id)

    def ActionShipuAdminRecipeRejectPost(self, request: Request,
                                        recipe_id: int = Query(..., description="食谱ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        审核拒绝食谱接口
        POST /api/shipu/admin/recipe/reject
        审核拒绝待审核的食谱
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.recipe_business.reject(recipe_id)

    def ActionShipuAdminCategoryCreatePost(self, request: Request, name: str = Query(..., description="分类名称"),
                                          description: str = Query('', description="分类描述"),
                                          icon: str = Query('', description="分类图标"),
                                          sort_order: int = Query(0, description="排序"),
                                          authorization: Optional[str] = Header(None)):
        """
        创建分类接口
        POST /api/shipu/admin/category/create
        创建新的食谱分类
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.category_business.create(name, description, icon, sort_order)

    def ActionShipuAdminCategoryUpdatePost(self, request: Request, category_id: int = Query(..., description="分类ID"),
                                          name: str = Query(..., description="分类名称"),
                                          description: str = Query('', description="分类描述"),
                                          icon: str = Query('', description="分类图标"),
                                          sort_order: int = Query(0, description="排序"),
                                          is_active: int = Query(1, description="是否启用"),
                                          authorization: Optional[str] = Header(None)):
        """
        更新分类接口
        POST /api/shipu/admin/category/update
        更新食谱分类信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {
            'name': name,
            'description': description,
            'icon': icon,
            'sort_order': sort_order,
            'is_active': is_active
        }
        return self.category_business.update(category_id, data)

    def ActionShipuAdminCategoryDeletePost(self, request: Request,
                                          category_id: int = Query(..., description="分类ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        删除分类接口
        POST /api/shipu/admin/category/delete
        删除食谱分类
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.category_business.delete(category_id)

    def ActionShipuAdminStatisticsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取统计数据接口
        GET /api/shipu/admin/statistics/get
        获取平台统计数据
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.recipe_business.get_statistics()
