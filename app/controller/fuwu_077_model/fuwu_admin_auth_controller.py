from typing import Optional
from fastapi import Request, Header
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    phone: str = Field(..., description="账号")
    password: str = Field(..., description="密码")


class AdminChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class FuwuAdminAuthController:
    def __init__(self):
        from app.business.fuwu_077_model.admin_auth_business import AdminAuthBusiness
        self.admin_auth_business = AdminAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_auth_business.verify_token(token)

    def ActionFuwu077ModelAdminAuthLoginPost(self, request: Request, body: AdminLoginRequest):
        """
        管理员登录接口
        POST /api/fuwu_077_model/admin_auth/login
        管理员账号密码登录
        """
        return self.admin_auth_business.login(
            phone=body.phone,
            password=body.password
        )

    def ActionFuwu077ModelAdminAuthLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        管理员登出接口
        POST /api/fuwu_077_model/admin_auth/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.admin_auth_business.logout(token)

    def ActionFuwu077ModelAdminAuthCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前管理员信息接口
        GET /api/fuwu_077_model/admin_auth/current/get
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

        return self.admin_auth_business.get_current_admin(token)

    def ActionFuwu077ModelAdminAuthPasswordChangePost(self, request: Request, body: AdminChangePasswordRequest,
                                               authorization: Optional[str] = Header(None)):
        """
        管理员修改密码接口
        POST /api/fuwu_077_model/admin_auth/password/change
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

        return self.admin_auth_business.change_password(
            admin_id=admin.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )
