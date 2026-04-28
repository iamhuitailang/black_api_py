from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")


class LoginRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    avatar_url: Optional[str] = Field(None, description="头像URL")
    city: Optional[str] = Field(None, description="所在城市")


class ExUserController:
    def __init__(self):
        from app.business.exchange import ExUserBusiness
        self.user_business = ExUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        
        token = request.query_params.get('token')
        if token:
            return token
        
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionExUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/ex/user/register
        新用户注册，返回用户信息和token
        """
        return self.user_business.register(
            phone=body.phone,
            password=body.password
        )

    def ActionExUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/ex/user/login
        手机号密码登录，返回用户信息和token
        """
        return self.user_business.login(
            phone=body.phone,
            password=body.password
        )

    def ActionExUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/ex/user/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionExUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/ex/user/current/get
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

    def ActionExUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/ex/user/profile/update
        更新昵称、头像、城市等个人资料
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
        if body.avatar_url is not None:
            data['avatar_url'] = body.avatar_url
        if body.city is not None:
            data['city'] = body.city
        
        return self.user_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionExUserProfileGet(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                authorization: Optional[str] = Header(None)):
        """
        获取用户主页接口
        GET /api/ex/user/profile/get
        获取用户主页信息，包括发布物品、交换历史、信用评分
        """
        token = self._get_token_from_header(request, authorization)
        viewer = self._get_current_user(token)
        viewer_id = viewer.get('id') if viewer else None
        
        return self.user_business.get_user_profile(user_id, viewer_id)

    def ActionExUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID")):
        """
        获取用户详情接口
        GET /api/ex/user/detail/get
        根据用户ID获取公开的用户信息
        """
        return self.user_business.get_user_by_id(user_id)
