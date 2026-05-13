from typing import Optional
from fastapi import Request, Header
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class UserRegisterRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")
    real_name: Optional[str] = Field(None, description="真实姓名")
    email: Optional[str] = Field(None, description="邮箱")


class UserLoginRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")


class BmAuthController:
    def __init__(self):
        from app.business.bm.auth_business import BmAuthBusiness
        self.auth_business = BmAuthBusiness()

    def _get_admin_token(self, request: Request, authorization: Optional[str] = None) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('admin_token')
        return token or ''

    def _get_user_token(self, request: Request, authorization: Optional[str] = None) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('user_token')
        return token or ''

    def ActionBmAdminLoginPost(self, request: Request, body: AdminLoginRequest):
        return self.auth_business.admin_login(
            username=body.username,
            password=body.password
        )

    def ActionBmAdminLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_admin_token(request, authorization)
        return self.auth_business.admin_logout(token)

    def ActionBmAdminCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_admin_token(request, authorization)
        admin = self.auth_business.get_admin_by_token(token)
        if admin:
            return {
                'code': 0,
                'msg': 'success',
                'data': {
                    'id': admin.get('id'),
                    'username': admin.get('username'),
                    'nickname': admin.get('nickname'),
                    'role': admin.get('role')
                }
            }
        return {
            'code': 1,
            'msg': '未登录',
            'data': None
        }

    def ActionBmUserRegisterPost(self, request: Request, body: UserRegisterRequest):
        return self.auth_business.user_register(
            phone=body.phone,
            password=body.password,
            nickname=body.nickname or '',
            real_name=body.real_name or '',
            email=body.email or ''
        )

    def ActionBmUserLoginPost(self, request: Request, body: UserLoginRequest):
        return self.auth_business.user_login(
            phone=body.phone,
            password=body.password
        )

    def ActionBmUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_user_token(request, authorization)
        return self.auth_business.user_logout(token)

    def ActionBmUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_user_token(request, authorization)
        user = self.auth_business.get_user_by_token(token)
        if user:
            return {
                'code': 0,
                'msg': 'success',
                'data': {
                    'id': user.get('id'),
                    'phone': user.get('phone'),
                    'nickname': user.get('nickname'),
                    'real_name': user.get('real_name')
                }
            }
        return {
            'code': 1,
            'msg': '未登录',
            'data': None
        }
