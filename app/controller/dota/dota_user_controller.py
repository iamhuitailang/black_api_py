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


class DotaUserController:
    def __init__(self):
        from app.business.dota.user_business import DotaUserBusiness
        self.user_business = DotaUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionDotaUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/dota/user/register
        新用户注册，返回用户信息和token
        """
        return self.user_business.register(
            username=body.username,
            password=body.password,
            nickname=body.nickname or ''
        )

    def ActionDotaUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/dota/user/login
        用户名密码登录，返回用户信息和token
        """
        return self.user_business.login(
            username=body.username,
            password=body.password
        )

    def ActionDotaUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/dota/user/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionDotaUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/dota/user/current/get
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

        return self.user_business.get_user_info(user.get('id'))

    def ActionDotaUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/dota/user/profile/update
        更新昵称等个人资料
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

        return self.user_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionDotaUserInfoGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户详细信息接口
        GET /api/dota/user/info/get
        获取用户完整信息，包括关卡进度等
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_info(user.get('id'))
