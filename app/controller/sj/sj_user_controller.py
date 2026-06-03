from typing import Optional
from fastapi import Request, Header
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
    avatar: Optional[str] = Field(None, description="头像")


class SjUserController:
    def __init__(self):
        from app.business.sj.user_business import SjUserBusiness
        self.user_business = SjUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionSjUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册
        POST /api/sj/user/register
        """
        return self.user_business.register(
            username=body.username,
            password=body.password,
            nickname=body.nickname or ''
        )

    def ActionSjUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录
        POST /api/sj/user/login
        """
        return self.user_business.login(
            username=body.username,
            password=body.password
        )

    def ActionSjUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出
        POST /api/sj/user/logout
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionSjUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息
        GET /api/sj/user/current/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.get_current_user(token)

    def ActionSjUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        更新个人资料
        POST /api/sj/user/profile/update
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
