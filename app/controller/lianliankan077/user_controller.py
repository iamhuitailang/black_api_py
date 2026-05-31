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


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    avatar: Optional[str] = Field(None, description="头像URL")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class LlkUserController:
    def __init__(self):
        from app.business.lianliankan077.user_business import LlkUserBusiness
        self.user_business = LlkUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionLlkUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/lianliankan/user/register
        """
        return self.user_business.register(
            username=body.username,
            password=body.password,
            nickname=body.nickname or ''
        )

    def ActionLlkUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/lianliankan/user/login
        """
        return self.user_business.login(
            username=body.username,
            password=body.password
        )

    def ActionLlkUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/lianliankan/user/logout
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionLlkUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息
        GET /api/lianliankan/user/current/get
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.get_current_user(token)

    def ActionLlkUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        更新用户资料
        POST /api/lianliankan/user/profile/update
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        data = {}
        if body.nickname is not None:
            data['nickname'] = body.nickname
        if body.avatar is not None:
            data['avatar'] = body.avatar
        return self.user_business.update_profile(user.get('id'), data)

    def ActionLlkUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        修改密码
        POST /api/lianliankan/user/password/change
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.user_business.change_password(
            user_id=user.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )
