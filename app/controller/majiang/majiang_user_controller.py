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
    phone: Optional[str] = Field(None, description="手机号")
    avatar: Optional[str] = Field(None, description="头像URL")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class MajiangUserController:
    def __init__(self):
        from app.business.majiang.user_business import MajiangUserBusiness
        self.user_business = MajiangUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        result = self.user_business.verify_token(token)
        if result.get('code') == 0:
            return result.get('data')
        return None

    def ActionMajiangUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/majiang/user/register
        新用户注册，返回用户信息和token
        """
        return self.user_business.register(
            username=body.username,
            password=body.password,
            nickname=body.nickname or ''
        )

    def ActionMajiangUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/majiang/user/login
        用户名密码登录，返回用户信息和token
        """
        return self.user_business.login(
            username=body.username,
            password=body.password
        )

    def ActionMajiangUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/majiang/user/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionMajiangUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/majiang/user/current/get
        根据token获取当前登录用户信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_by_id(user.get('id'))

    def ActionMajiangUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                           authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/majiang/user/profile/update
        更新昵称、头像等个人资料
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.nickname is not None:
            data['nickname'] = body.nickname
        if body.phone is not None:
            data['phone'] = body.phone
        if body.avatar is not None:
            data['avatar'] = body.avatar

        return self.user_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionMajiangUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                             authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/majiang/user/password/change
        验证原密码后修改为新密码
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

    def ActionMajiangUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取用户详情接口
        GET /api/majiang/user/detail/get
        根据用户ID获取公开的用户信息
        """
        return self.user_business.get_user_by_id(user_id)
