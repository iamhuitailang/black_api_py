from typing import Optional
from fastapi import APIRouter, Query, Request, Header
from pydantic import BaseModel, Field
from app.business.auth import AuthBusiness


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    student_id: str = Field(..., description="学号")
    real_name: str = Field(..., description="真实姓名")
    phone: str = Field('', description="手机号")
    major: str = Field('', description="专业")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class UpdateProfileRequest(BaseModel):
    real_name: Optional[str] = Field(None, description="真实姓名")
    phone: Optional[str] = Field(None, description="手机号")
    major: Optional[str] = Field(None, description="专业")
    student_id: Optional[str] = Field(None, description="学号")


class AuthController:
    def __init__(self):
        self.auth_business = AuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        
        token = request.query_params.get('token')
        if token:
            return token
        
        return ''

    def ActionAuthRegisterPost(self, request: Request, body: RegisterRequest):
        """
        学生注册接口
        POST /api/auth/register
        学生账号注册
        """
        return self.auth_business.register_student(
            username=body.username,
            password=body.password,
            student_id=body.student_id,
            real_name=body.real_name,
            phone=body.phone,
            major=body.major
        )

    def ActionAuthLoginPost(self, request: Request, body: LoginRequest):
        """
        登录接口
        POST /api/auth/login
        验证用户名和密码，返回token
        """
        return self.auth_business.login(
            username=body.username,
            password=body.password
        )

    def ActionAuthLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        登出接口
        POST /api/auth/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.logout(token)

    def ActionAuthCurrentUserGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/auth/current/user/get
        根据token获取当前登录用户信息
        """
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.get_current_user(token)

    def ActionAuthPasswordChangePost(self, request: Request, body: ChangePasswordRequest, authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/auth/password/change
        验证原密码后修改为新密码
        """
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)
        
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        return self.auth_business.change_password(
            user_id=user.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )

    def ActionAuthProfileUpdatePost(self, request: Request, body: UpdateProfileRequest, authorization: Optional[str] = Header(None)):
        """
        更新用户资料接口
        POST /api/auth/profile/update
        登录后修改个人资料
        """
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)
        
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        return self.auth_business.update_profile(
            user_id=user.get('id'),
            real_name=body.real_name,
            phone=body.phone,
            major=body.major,
            student_id=body.student_id
        )
