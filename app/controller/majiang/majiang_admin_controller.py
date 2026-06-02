from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class CreateAdminRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    real_name: Optional[str] = Field(None, description="真实姓名")


class AdminChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class AdminUpdateProfileRequest(BaseModel):
    real_name: Optional[str] = Field(None, description="真实姓名")
    avatar: Optional[str] = Field(None, description="头像URL")


class MajiangAdminController:
    def __init__(self):
        from app.business.majiang.admin_business import MajiangAdminBusiness
        from app.business.majiang.user_business import MajiangUserBusiness
        self.admin_business = MajiangAdminBusiness()
        self.user_business = MajiangUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionMajiangAdminLoginPost(self, request: Request, body: AdminLoginRequest):
        """
        管理员登录接口
        POST /api/majiang/admin/login
        管理员账号密码登录
        """
        return self.admin_business.login(
            username=body.username,
            password=body.password
        )

    def ActionMajiangAdminLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        管理员登出接口
        POST /api/majiang/admin/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.admin_business.logout(token)

    def ActionMajiangAdminCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前管理员信息接口
        GET /api/majiang/admin/current/get
        根据token获取当前登录管理员信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.get_current_admin(token)

    def ActionMajiangAdminCreatePost(self, request: Request, body: CreateAdminRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        创建管理员接口
        POST /api/majiang/admin/create
        超级管理员创建新管理员账号
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if admin.get('username') != 'admin':
            return {
                'code': 1,
                'msg': '只有超级管理员可以创建新管理员',
                'data': None
            }

        return self.admin_business.create_admin(
            username=body.username,
            password=body.password,
            real_name=body.real_name or ''
        )

    def ActionMajiangAdminPasswordChangePost(self, request: Request, body: AdminChangePasswordRequest,
                                              authorization: Optional[str] = Header(None)):
        """
        修改管理员密码接口
        POST /api/majiang/admin/password/change
        验证原密码后修改为新密码
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.change_password(
            admin_id=admin.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )

    def ActionMajiangAdminProfileUpdatePost(self, request: Request, body: AdminUpdateProfileRequest,
                                             authorization: Optional[str] = Header(None)):
        """
        更新管理员资料接口
        POST /api/majiang/admin/profile/update
        更新真实姓名、头像等资料
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
        if body.real_name is not None:
            data['real_name'] = body.real_name
        if body.avatar is not None:
            data['avatar'] = body.avatar

        return self.admin_business.update_profile(
            admin_id=admin.get('id'),
            data=data
        )

    def ActionMajiangAdminListGet(self, request: Request,
                                   page: int = Query(1, ge=1, description="页码"),
                                   page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取管理员列表接口
        GET /api/majiang/admin/list/get
        超级管理员获取所有管理员列表
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if admin.get('username') != 'admin':
            return {
                'code': 1,
                'msg': '只有超级管理员可以查看管理员列表',
                'data': None
            }

        return self.admin_business.get_admin_list(page=page, page_size=page_size)

    def ActionMajiangAdminDeletePost(self, request: Request, admin_id: int = Query(..., description="管理员ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        删除管理员接口
        POST /api/majiang/admin/delete
        超级管理员删除其他管理员
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if admin.get('username') != 'admin':
            return {
                'code': 1,
                'msg': '只有超级管理员可以删除管理员',
                'data': None
            }

        return self.admin_business.delete_admin(admin_id=admin_id)

    def ActionMajiangAdminDisablePost(self, request: Request, admin_id: int = Query(..., description="管理员ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        禁用管理员接口
        POST /api/majiang/admin/disable
        超级管理员禁用其他管理员
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if admin.get('username') != 'admin':
            return {
                'code': 1,
                'msg': '只有超级管理员可以禁用管理员',
                'data': None
            }

        return self.admin_business.disable_admin(admin_id=admin_id)

    def ActionMajiangAdminEnablePost(self, request: Request, admin_id: int = Query(..., description="管理员ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        启用管理员接口
        POST /api/majiang/admin/enable
        超级管理员启用其他管理员
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if admin.get('username') != 'admin':
            return {
                'code': 1,
                'msg': '只有超级管理员可以启用管理员',
                'data': None
            }

        return self.admin_business.enable_admin(admin_id=admin_id)

    def ActionMajiangAdminUserListGet(self, request: Request,
                                       page: int = Query(1, ge=1, description="页码"),
                                       page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                       status: Optional[int] = Query(None, description="用户状态"),
                                       keyword: Optional[str] = Query(None, description="搜索关键词"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口
        GET /api/majiang/admin/user/list/get
        管理员获取用户列表
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_list(
            page=page,
            page_size=page_size,
            status=status,
            keyword=keyword
        )

    def ActionMajiangAdminUserBanPost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        封号用户接口
        POST /api/majiang/admin/user/ban
        管理员封号用户
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.ban_user(user_id=user_id)

    def ActionMajiangAdminUserUnbanPost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        解封用户接口
        POST /api/majiang/admin/user/unban
        管理员解封用户
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.unban_user(user_id=user_id)
