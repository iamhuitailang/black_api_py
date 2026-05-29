from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")
    city: Optional[str] = Field(None, description="城市")


class LoginRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    avatar: Optional[str] = Field(None, description="头像URL")
    city: Optional[str] = Field(None, description="城市")
    district: Optional[str] = Field(None, description="区域")
    bio: Optional[str] = Field(None, description="个人简介")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class HuodongUserController:
    def __init__(self):
        from app.business.huodong.user_business import HuodongUserBusiness
        self.user_business = HuodongUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionHuodongUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/huodong/user/register
        """
        return self.user_business.register(
            phone=body.phone,
            password=body.password,
            nickname=body.nickname or '',
            city=body.city or ''
        )

    def ActionHuodongUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/huodong/user/login
        """
        return self.user_business.login(
            phone=body.phone,
            password=body.password
        )

    def ActionHuodongUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/huodong/user/logout
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionHuodongUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息
        GET /api/huodong/user/current/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.get_user_by_id(user.get('id'))

    def ActionHuodongUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                            authorization: Optional[str] = Header(None)):
        """
        更新个人资料
        POST /api/huodong/user/profile/update
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
        if body.city is not None:
            data['city'] = body.city
        if body.district is not None:
            data['district'] = body.district
        if body.bio is not None:
            data['bio'] = body.bio
        return self.user_business.update_profile(user_id=user.get('id'), data=data)

    def ActionHuodongUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                              authorization: Optional[str] = Header(None)):
        """
        修改密码
        POST /api/huodong/user/password/change
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

    def ActionHuodongUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID")):
        """
        获取用户详情
        GET /api/huodong/user/detail/get
        """
        return self.user_business.get_user_by_id(user_id)
