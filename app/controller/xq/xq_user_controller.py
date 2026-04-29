from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")
    community: Optional[str] = Field(None, description="小区名称")


class LoginRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    community: Optional[str] = Field(None, description="小区名称")
    avatar: Optional[str] = Field(None, description="头像URL")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class XqUserController:
    def __init__(self):
        from app.business.xq.user_business import XqUserBusiness
        self.user_business = XqUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionXqUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/xq/user/register
        新用户注册，返回用户信息和token
        """
        return self.user_business.register(
            phone=body.phone,
            password=body.password,
            nickname=body.nickname or '',
            community=body.community or ''
        )

    def ActionXqUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/xq/user/login
        手机号密码登录，返回用户信息和token
        """
        return self.user_business.login(
            phone=body.phone,
            password=body.password
        )

    def ActionXqUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/xq/user/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionXqUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/xq/user/current/get
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

    def ActionXqUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/xq/user/profile/update
        更新昵称、小区、头像等个人资料
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
        if body.community is not None:
            data['community'] = body.community
        if body.avatar is not None:
            data['avatar'] = body.avatar

        return self.user_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionXqUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/xq/user/password/change
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

    def ActionXqUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID"),
                               authorization: Optional[str] = Header(None)):
        """
        获取用户详情接口
        GET /api/xq/user/detail/get
        根据用户ID获取公开的用户信息
        """
        return self.user_business.get_user_by_id(user_id)
