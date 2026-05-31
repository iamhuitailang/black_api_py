from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class AdminChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class AdminUpdateProfileRequest(BaseModel):
    real_name: Optional[str] = Field(None, description="真实姓名")
    avatar: Optional[str] = Field(None, description="头像URL")


class CreateAdminRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    real_name: Optional[str] = Field(None, description="真实姓名")


class Chongwu09AdminController:
    def __init__(self):
        from app.business.chongwu09.admin_business import AdminBusiness
        from app.business.chongwu09.user_business import UserBusiness
        self.admin_business = AdminBusiness()
        self.user_business = UserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionChongwu09AdminLoginPost(self, request: Request, body: AdminLoginRequest):
        """
        管理员登录接口
        POST /api/chongwu09/admin/login
        """
        return self.admin_business.login(username=body.username, password=body.password)

    def ActionChongwu09AdminLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        管理员登出接口
        POST /api/chongwu09/admin/logout
        """
        token = self._get_token_from_header(request, authorization)
        return self.admin_business.logout(token)

    def ActionChongwu09AdminCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前管理员信息
        GET /api/chongwu09/admin/current/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.admin_business.get_current_admin(token)

    def ActionChongwu09AdminPasswordChangePost(self, request: Request, body: AdminChangePasswordRequest,
                                                 authorization: Optional[str] = Header(None)):
        """
        修改管理员密码
        POST /api/chongwu09/admin/password/change
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.admin_business.change_password(
            admin_id=admin.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )

    def ActionChongwu09AdminProfileUpdatePost(self, request: Request, body: AdminUpdateProfileRequest,
                                                authorization: Optional[str] = Header(None)):
        """
        更新管理员资料
        POST /api/chongwu09/admin/profile/update
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        data = {}
        if body.real_name is not None:
            data['real_name'] = body.real_name
        if body.avatar is not None:
            data['avatar'] = body.avatar
        return self.admin_business.update_profile(admin_id=admin.get('id'), data=data)

    def ActionChongwu09AdminUserListGet(self, request: Request,
                                         page: int = Query(1, ge=1),
                                         page_size: int = Query(10, ge=1, le=100),
                                         status: Optional[int] = Query(None),
                                         keyword: Optional[str] = Query(None),
                                         authorization: Optional[str] = Header(None)):
        """
        管理员获取用户列表
        GET /api/chongwu09/admin/user/list/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.get_user_list(page=page, page_size=page_size, status=status, keyword=keyword)

    def ActionChongwu09AdminUserBanPost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        封号用户
        POST /api/chongwu09/admin/user/ban
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.ban_user(user_id=user_id)

    def ActionChongwu09AdminUserUnbanPost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                           authorization: Optional[str] = Header(None)):
        """
        解封用户
        POST /api/chongwu09/admin/user/unban
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.unban_user(user_id=user_id)
