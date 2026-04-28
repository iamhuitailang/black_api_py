from typing import Optional
from fastapi import APIRouter, Query, Request, Header
from pydantic import BaseModel, Field
from app.business.dj import DjAuthBusiness


class LoginRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")


class RegisterRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class ResetPasswordRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    new_password: str = Field(..., description="新密码")


class DjAuthController:
    def __init__(self):
        self.auth_business = DjAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def ActionDjAuthLoginPost(self, request: Request, body: LoginRequest):
        """
        登录接口
        POST /api/dj/auth/login
        验证手机号和密码，返回token
        """
        return self.auth_business.login(
            phone=body.phone,
            password=body.password
        )

    def ActionDjAuthRegisterPost(self, request: Request, body: RegisterRequest):
        """
        注册接口
        POST /api/dj/auth/register
        用户注册
        """
        return self.auth_business.register(
            phone=body.phone,
            password=body.password,
            nickname=body.nickname
        )

    def ActionDjAuthLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        登出接口
        POST /api/dj/auth/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.logout(token)

    def ActionDjAuthCurrentUserGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/dj/auth/current/user/get
        根据token获取当前登录用户信息
        """
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.get_current_user(token)

    def ActionDjAuthPasswordChangePost(self, request: Request, body: ChangePasswordRequest, authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/dj/auth/password/change
        验证原密码后修改为新密码
        """
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.auth_business.change_password(
            user_id=user.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )

    def ActionDjAuthPasswordResetPost(self, request: Request, body: ResetPasswordRequest):
        """
        重置密码接口
        POST /api/dj/auth/password/reset
        通过手机号重置密码
        """
        return self.auth_business.reset_password(
            phone=body.phone,
            new_password=body.new_password
        )
