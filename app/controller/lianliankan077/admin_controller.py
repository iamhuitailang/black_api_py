from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class AdminChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class LlkAdminController:
    def __init__(self):
        from app.business.lianliankan077.admin_business import LlkAdminBusiness
        from app.business.lianliankan077.user_business import LlkUserBusiness
        self.admin_business = LlkAdminBusiness()
        self.user_business = LlkUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionLlkAdminLoginPost(self, request: Request, body: AdminLoginRequest):
        """
        管理员登录
        POST /api/lianliankan/admin/login
        """
        return self.admin_business.login(
            username=body.username,
            password=body.password
        )

    def ActionLlkAdminLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        管理员登出
        POST /api/lianliankan/admin/logout
        """
        token = self._get_token_from_header(request, authorization)
        return self.admin_business.logout(token)

    def ActionLlkAdminCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前管理员信息
        GET /api/lianliankan/admin/current/get
        """
        token = self._get_token_from_header(request, authorization)
        return self.admin_business.get_current_admin(token)

    def ActionLlkAdminPasswordChangePost(self, request: Request, body: AdminChangePasswordRequest,
                                          authorization: Optional[str] = Header(None)):
        """
        修改管理员密码
        POST /api/lianliankan/admin/password/change
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

    def ActionLlkAdminUserListGet(self, request: Request,
                                   page: int = Query(1, ge=1, description="页码"),
                                   page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                   status: Optional[int] = Query(None, description="用户状态"),
                                   keyword: Optional[str] = Query(None, description="搜索关键词"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取用户列表
        GET /api/lianliankan/admin/user/list/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.user_business.get_user_list(
            page=page, page_size=page_size,
            status=status, keyword=keyword
        )

    def ActionLlkAdminUserBanPost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        封禁用户
        POST /api/lianliankan/admin/user/ban
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.user_business.ban_user(user_id=user_id)

    def ActionLlkAdminUserUnbanPost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        解封用户
        POST /api/lianliankan/admin/user/unban
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.user_business.unban_user(user_id=user_id)

    def ActionLlkAdminUserDeletePost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        删除用户
        POST /api/lianliankan/admin/user/delete
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.user_business.delete_user(user_id=user_id)
