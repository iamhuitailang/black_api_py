from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")
    avatar: Optional[str] = Field(None, description="头像URL")


class LoginRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    avatar: Optional[str] = Field(None, description="头像URL")
    bio: Optional[str] = Field(None, description="个人简介")
    level: Optional[str] = Field(None, description="户外等级")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class YeyouUserController:
    def __init__(self):
        from app.business.yeyou.user_business import YeyouUserBusiness
        self.user_business = YeyouUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionYeyouUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/yeyou/user/register
        新用户注册，返回用户信息和token
        """
        return self.user_business.register(
            phone=body.phone,
            password=body.password,
            nickname=body.nickname or '',
            avatar=body.avatar or ''
        )

    def ActionYeyouUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/yeyou/user/login
        手机号密码登录，返回用户信息和token
        """
        return self.user_business.login(
            phone=body.phone,
            password=body.password
        )

    def ActionYeyouUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/yeyou/user/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionYeyouUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/yeyou/user/current/get
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

    def ActionYeyouUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                          authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/yeyou/user/profile/update
        更新昵称、头像、简介等个人资料
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
        if body.level is not None:
            data['level'] = body.level

        return self.user_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionYeyouUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                           authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/yeyou/user/password/change
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

    def ActionYeyouUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取用户详情接口
        GET /api/yeyou/user/detail/get
        根据用户ID获取公开的用户信息
        """
        return self.user_business.get_user_by_id(user_id)

    def ActionYeyouUserLeaderUpgradePost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        升级为领队接口
        POST /api/yeyou/user/leader/upgrade
        用户申请成为领队
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.upgrade_to_leader(user.get('id'))
