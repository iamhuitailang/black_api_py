from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    email: str = Field(..., description="邮箱")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    avatar: Optional[str] = Field(None, description="头像URL")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class YpUserController:
    def __init__(self):
        from app.business.yp.user_business import YpUserBusiness
        self.user_business = YpUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionYpUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/yp/user/register
        新用户注册，返回用户信息和token
        """
        return self.user_business.register(
            username=body.username,
            email=body.email,
            password=body.password,
            nickname=body.nickname or ''
        )

    def ActionYpUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/yp/user/login
        用户名密码登录，返回用户信息和token
        """
        return self.user_business.login(
            username=body.username,
            password=body.password
        )

    def ActionYpUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/yp/user/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionYpUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/yp/user/current/get
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

    def ActionYpUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/yp/user/profile/update
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
        if body.avatar is not None:
            data['avatar'] = body.avatar

        return self.user_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionYpUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/yp/user/password/change
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

    def ActionYpUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID"),
                               authorization: Optional[str] = Header(None)):
        """
        获取用户详情接口
        GET /api/yp/user/detail/get
        根据用户ID获取公开的用户信息
        """
        return self.user_business.get_user_by_id(user_id)

    def ActionYpUserLeaderboardGet(self, request: Request, page: int = Query(1, description="页码"),
                                    page_size: int = Query(20, description="每页数量")):
        """
        获取排行榜接口
        GET /api/yp/user/leaderboard/get
        获取所有用户的得分排行榜
        """
        return self.user_business.get_leaderboard(page, page_size)
