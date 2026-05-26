from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")
    email: Optional[str] = Field(None, description="邮箱")


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    avatar: Optional[str] = Field(None, description="头像URL")
    email: Optional[str] = Field(None, description="邮箱")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class ManhuaUserController:
    def __init__(self):
        from app.business.manhua.user_business import ManhuaUserBusiness
        self.user_business = ManhuaUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionManhuaUserRegisterPost(self, request: Request, body: RegisterRequest):
        return self.user_business.register(
            username=body.username,
            password=body.password,
            nickname=body.nickname or '',
            email=body.email or ''
        )

    def ActionManhuaUserLoginPost(self, request: Request, body: LoginRequest):
        return self.user_business.login(
            username=body.username,
            password=body.password
        )

    def ActionManhuaUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionManhuaUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_by_id(user.get('id'))

    def ActionManhuaUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                          authorization: Optional[str] = Header(None)):
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
        if body.email is not None:
            data['email'] = body.email

        return self.user_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionManhuaUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                           authorization: Optional[str] = Header(None)):
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