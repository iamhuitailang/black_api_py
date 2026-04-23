from typing import Optional
from fastapi import APIRouter, Query, Request, Header
from pydantic import BaseModel, Field
from app.business.auth import AuthBusiness


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class AuthController:
    def __init__(self):
        self.auth_business = AuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        
        token = request.query_params.get('token')
        if token:
            return token
        
        return ''

    def ActionAuthLoginPost(self, request: Request, body: LoginRequest):
        """
        登录接口
        POST /api/auth/login
        验证用户名和密码，返回token
        """
        return self.auth_business.login(
            username=body.username,
            password=body.password
        )

    def ActionAuthLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        登出接口
        POST /api/auth/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.logout(token)

    def ActionAuthCurrentUserGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/auth/current/user/get
        根据token获取当前登录用户信息
        """
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.get_current_user(token)

    def ActionAuthPasswordChangePost(self, request: Request, body: ChangePasswordRequest, authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/auth/password/change
        验证原密码后修改为新密码
        """
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)
        
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        return self.auth_business.change_password(
            user_id=user.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )
