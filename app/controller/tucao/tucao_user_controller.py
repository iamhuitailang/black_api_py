from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class TucaoUserController:
    def __init__(self):
        from app.business.tucao.user_business import TucaoUserBusiness
        self.user_business = TucaoUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionTucaoUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/tucao/user/register
        """
        return self.user_business.register(
            username=body.username,
            password=body.password,
            nickname=body.nickname or ''
        )

    def ActionTucaoUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/tucao/user/login
        """
        return self.user_business.login(
            username=body.username,
            password=body.password
        )

    def ActionTucaoUserLogoutPost(self, request: Request,
                                  authorization: Optional[str] = Header(None)):
        """
        用户退出登录接口
        POST /api/tucao/user/logout
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionTucaoUserInfoGet(self, request: Request,
                               authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/tucao/user/info/get
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.get_current_user(token)

    def ActionTucaoUserChangePasswordPost(self, request: Request, body: ChangePasswordRequest,
                                          authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/tucao/user/change/password
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.change_password(
            user_id=user.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )
