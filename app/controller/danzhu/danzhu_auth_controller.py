from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class ChangeAdminPasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class DanzhuAuthController:
    def __init__(self):
        from app.business.danzhu import DanzhuAuthBusiness
        self.auth_business = DanzhuAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str):
        return self.auth_business.verify_admin_token(token)

    def ActionDanzhuAdminLoginPost(self, request: Request, body: AdminLoginRequest):
        """
        管理员登录接口
        POST /api/danzhu/admin/login
        管理员登录，返回管理员信息和token
        """
        return self.auth_business.admin_login(
            username=body.username,
            password=body.password
        )

    def ActionDanzhuAdminLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        管理员登出接口
        POST /api/danzhu/admin/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.admin_logout(token)

    def ActionDanzhuAdminCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前管理员信息接口
        GET /api/danzhu/admin/current/get
        根据token获取当前登录管理员信息
        """
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.get_current_admin(token)

    def ActionDanzhuAdminPasswordChangePost(self, request: Request, body: ChangeAdminPasswordRequest,
                                             authorization: Optional[str] = Header(None)):
        """
        修改管理员密码接口
        POST /api/danzhu/admin/password/change
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

        return self.auth_business.change_admin_password(
            admin_id=admin.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )
