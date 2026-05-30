from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")
    real_name: Optional[str] = Field(None, description="真实姓名")
    student_id: Optional[str] = Field(None, description="学号")
    college: Optional[str] = Field(None, description="学院")
    contact: Optional[str] = Field(None, description="联系方式")


class LoginRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    real_name: Optional[str] = Field(None, description="真实姓名")
    student_id: Optional[str] = Field(None, description="学号")
    college: Optional[str] = Field(None, description="学院")
    contact: Optional[str] = Field(None, description="联系方式")
    avatar: Optional[str] = Field(None, description="头像URL")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class ShiwuUserController:
    def __init__(self):
        from app.business.shiwu.user_business import UserBusiness
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

    def ActionShiwuUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/shiwu/user/register
        新用户注册，返回用户信息和token
        """
        return self.user_business.register(
            phone=body.phone,
            password=body.password,
            nickname=body.nickname or '',
            real_name=body.real_name or '',
            student_id=body.student_id or '',
            college=body.college or '',
            contact=body.contact or ''
        )

    def ActionShiwuUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/shiwu/user/login
        手机号密码登录，返回用户信息和token
        """
        return self.user_business.login(
            phone=body.phone,
            password=body.password
        )

    def ActionShiwuUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/shiwu/user/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionShiwuUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/shiwu/user/current/get
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

    def ActionShiwuUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                          authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/shiwu/user/profile/update
        更新昵称、学院、学号等个人资料
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
        if body.real_name is not None:
            data['real_name'] = body.real_name
        if body.student_id is not None:
            data['student_id'] = body.student_id
        if body.college is not None:
            data['college'] = body.college
        if body.contact is not None:
            data['contact'] = body.contact
        if body.avatar is not None:
            data['avatar'] = body.avatar

        return self.user_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionShiwuUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                           authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/shiwu/user/password/change
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

    def ActionShiwuUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID")):
        """
        获取用户详情接口
        GET /api/shiwu/user/detail/get
        根据用户ID获取公开的用户信息
        """
        return self.user_business.get_user_by_id(user_id)
