from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class UserRegisterRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")


class UserLoginRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    avatar: Optional[str] = Field(None, description="头像URL")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class Chongwu09UserController:
    def __init__(self):
        from app.business.chongwu09.user_business import UserBusiness
        self.user_business = UserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionChongwu09UserRegisterPost(self, request: Request, body: UserRegisterRequest):
        """
        用户注册接口
        POST /api/chongwu09/user/register
        """
        return self.user_business.register(
            phone=body.phone,
            password=body.password,
            nickname=body.nickname or ''
        )

    def ActionChongwu09UserLoginPost(self, request: Request, body: UserLoginRequest):
        """
        用户登录接口
        POST /api/chongwu09/user/login
        """
        return self.user_business.login(phone=body.phone, password=body.password)

    def ActionChongwu09UserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/chongwu09/user/logout
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionChongwu09UserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息
        GET /api/chongwu09/user/current/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.get_user_by_id(user.get('id'))

    def ActionChongwu09UserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                               authorization: Optional[str] = Header(None)):
        """
        更新个人资料
        POST /api/chongwu09/user/profile/update
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
        return self.user_business.update_profile(user_id=user.get('id'), data=data)

    def ActionChongwu09UserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                                authorization: Optional[str] = Header(None)):
        """
        修改密码
        POST /api/chongwu09/user/password/change
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
