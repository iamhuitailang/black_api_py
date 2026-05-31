from typing import Optional
from fastapi import Request
from pydantic import BaseModel, Field
from app.business.chengyu_077.user_business import ChengyuUserBusiness


class ChengyuRegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    nickname: str = Field('', description="昵称")
    email: str = Field('', description="邮箱")


class ChengyuLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class ChengyuChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class ChengyuUpdateProfileRequest(BaseModel):
    nickname: str = Field(None, description="昵称")
    email: str = Field(None, description="邮箱")


class ChengyuUserController:
    def __init__(self):
        self.business = ChengyuUserBusiness()

    def _get_token(self, request: Request) -> str:
        auth = request.headers.get('authorization', '')
        if auth and auth.startswith('Bearer '):
            return auth[7:]
        return request.query_params.get('token', '')

    def _get_current_user_id(self, request: Request) -> Optional[int]:
        token = self._get_token(request)
        if not token:
            return None
        user = self.business.verify_token(token)
        if user:
            return user.get('id')
        return None

    def ActionChengyuUserRegisterPost(self, request: Request, body: ChengyuRegisterRequest):
        """
        成语接龙用户注册
        POST /api/chengyu/user/register
        """
        return self.business.register(body.username, body.password, body.nickname, body.email)

    def ActionChengyuUserLoginPost(self, request: Request, body: ChengyuLoginRequest):
        """
        成语接龙用户登录
        POST /api/chengyu/user/login
        """
        return self.business.login(body.username, body.password)

    def ActionChengyuUserMeGet(self, request: Request):
        """
        获取当前用户信息
        GET /api/chengyu/user/me
        """
        token = self._get_token(request)
        return self.business.get_current_user(token)

    def ActionChengyuUserMePut(self, request: Request, body: ChengyuUpdateProfileRequest):
        """
        更新当前用户信息
        PUT /api/chengyu/user/me
        """
        user_id = self._get_current_user_id(request)
        if not user_id:
            return {'code': 1, 'message': '未登录', 'data': None}
        return self.business.update_profile(user_id, body.nickname, body.email)

    def ActionChengyuUserChangePasswordPost(self, request: Request, body: ChengyuChangePasswordRequest):
        """
        修改密码
        POST /api/chengyu/user/change-password
        """
        user_id = self._get_current_user_id(request)
        if not user_id:
            return {'code': 1, 'message': '未登录', 'data': None}
        return self.business.change_password(user_id, body.old_password, body.new_password)
