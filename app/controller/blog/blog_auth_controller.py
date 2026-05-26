from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field

from app.business.blog import BlogAuthBusiness


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")
    email: Optional[str] = Field(None, description="邮箱")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    email: Optional[str] = Field(None, description="邮箱")
    avatar: Optional[str] = Field(None, description="头像 URL")
    bio: Optional[str] = Field(None, description="个人简介")
    site_url: Optional[str] = Field(None, description="个人站点")
    github: Optional[str] = Field(None, description="GitHub 用户名")


class BlogAuthController:
    def __init__(self):
        self.auth_business = BlogAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def ActionBlogAuthLoginPost(self, request: Request, body: LoginRequest):
        """
        登录接口
        POST /api/blog/auth/login
        验证用户名和密码，返回 token
        """
        return self.auth_business.login(username=body.username, password=body.password)

    def ActionBlogAuthRegisterPost(self, request: Request, body: RegisterRequest):
        """
        注册接口
        POST /api/blog/auth/register
        创建新用户并自动登录
        """
        return self.auth_business.register(
            username=body.username,
            password=body.password,
            nickname=body.nickname,
            email=body.email
        )

    def ActionBlogAuthLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        登出接口
        POST /api/blog/auth/logout
        使当前 token 失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.logout(token)

    def ActionBlogAuthCurrentUserGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息
        GET /api/blog/auth/current/user/get
        根据 token 获取当前登录用户信息
        """
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.get_current_user(token)

    def ActionBlogAuthPasswordChangePost(self, request: Request, body: ChangePasswordRequest, authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/blog/auth/password/change
        """
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.auth_business.change_password(
            user_id=user.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )

    def ActionBlogAuthProfileUpdatePost(self, request: Request, body: UpdateProfileRequest, authorization: Optional[str] = Header(None)):
        """
        更新个人信息
        POST /api/blog/auth/profile/update
        """
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        data = {
            'nickname': body.nickname,
            'email': body.email,
            'avatar': body.avatar,
            'bio': body.bio,
            'site_url': body.site_url,
            'github': body.github
        }
        return self.auth_business.update_profile(user_id=user.get('id'), data={k: v for k, v in data.items() if v is not None})
