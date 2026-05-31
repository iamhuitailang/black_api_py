from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    email: str = Field(..., description="邮箱")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名/邮箱")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    avatar: Optional[str] = Field(None, description="头像URL")
    bio: Optional[str] = Field(None, description="个人简介")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class ShipuUserController:
    def __init__(self):
        from app.business.shipu.user_business import ShipuUserBusiness
        self.user_business = ShipuUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionShipuUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/shipu/user/register
        新用户注册，返回用户信息和token
        """
        return self.user_business.register(
            username=body.username,
            email=body.email,
            password=body.password,
            nickname=body.nickname or ''
        )

    def ActionShipuUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/shipu/user/login
        用户名密码登录，返回用户信息和token
        """
        return self.user_business.login(
            username=body.username,
            password=body.password
        )

    def ActionShipuUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/shipu/user/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionShipuUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/shipu/user/current/get
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

    def ActionShipuUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/shipu/user/profile/update
        更新昵称、头像、个人简介等个人资料
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
        if body.avatar is not None:
            data['avatar'] = body.avatar
        if body.bio is not None:
            data['bio'] = body.bio

        return self.user_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionShipuUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/shipu/user/password/change
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

    def ActionShipuUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID"),
                               authorization: Optional[str] = Header(None)):
        """
        获取用户详情接口
        GET /api/shipu/user/detail/get
        根据用户ID获取公开的用户信息
        """
        return self.user_business.get_user_by_id(user_id)
