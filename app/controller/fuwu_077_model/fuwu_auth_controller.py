from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")
    address: Optional[str] = Field(None, description="地址")


class LoginRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    address: Optional[str] = Field(None, description="地址")
    avatar: Optional[str] = Field(None, description="头像URL")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class FuwuAuthController:
    def __init__(self):
        from app.business.fuwu_077_model.auth_business import AuthBusiness
        self.auth_business = AuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def ActionFuwu077ModelAuthRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/fuwu_077_model/auth/register
        新用户注册，返回用户信息和token
        """
        return self.auth_business.register(
            phone=body.phone,
            password=body.password,
            nickname=body.nickname or '',
            address=body.address or ''
        )

    def ActionFuwu077ModelAuthLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/fuwu_077_model/auth/login
        手机号密码登录，返回用户信息和token
        """
        return self.auth_business.login(
            phone=body.phone,
            password=body.password
        )

    def ActionFuwu077ModelAuthLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/fuwu_077_model/auth/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.logout(token)

    def ActionFuwu077ModelAuthCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/fuwu_077_model/auth/current/get
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

        return self.auth_business.get_current_user(token)

    def ActionFuwu077ModelAuthProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/fuwu_077_model/auth/profile/update
        更新昵称、地址、头像等个人资料
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
        if body.address is not None:
            data['address'] = body.address
        if body.avatar is not None:
            data['avatar'] = body.avatar

        return self.auth_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionFuwu077ModelAuthPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                          authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/fuwu_077_model/auth/password/change
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

        return self.auth_business.change_password(
            user_id=user.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )
