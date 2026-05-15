from typing import Optional
from fastapi import Request, Header
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class RankingAuthController:
    def __init__(self):
        from app.business.ranking import AuthBusiness
        self.auth_business = AuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def ActionRankingAuthRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/ranking/auth/register
        新用户注册，返回用户信息和token
        """
        return self.auth_business.register(
            username=body.username,
            password=body.password
        )

    def ActionRankingAuthLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/ranking/auth/login
        用户名密码登录，返回用户信息和token
        """
        return self.auth_business.login(
            username=body.username,
            password=body.password
        )

    def ActionRankingAuthLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/ranking/auth/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.logout(token)

    def ActionRankingAuthCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/ranking/auth/current/get
        根据token获取当前登录用户信息
        """
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.get_current_user(token)
