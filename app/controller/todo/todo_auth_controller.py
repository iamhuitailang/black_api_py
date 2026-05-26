from typing import Optional
from fastapi import Request, Header
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    email: str = Field(..., description="邮箱")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")


class LoginRequest(BaseModel):
    login_name: str = Field(..., description="用户名或邮箱")
    password: str = Field(..., description="密码")


class TodoAuthController:
    def __init__(self):
        from app.business.todo.todo_auth_business import TodoAuthBusiness
        self.auth_business = TodoAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def ActionTodoAuthRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/todo/auth/register
        新用户注册，返回用户信息和token
        """
        return self.auth_business.register(
            username=body.username,
            email=body.email,
            password=body.password,
            nickname=body.nickname or ''
        )

    def ActionTodoAuthLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/todo/auth/login
        用户名或邮箱密码登录，返回用户信息和token
        """
        return self.auth_business.login(
            login_name=body.login_name,
            password=body.password
        )

    def ActionTodoAuthLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/todo/auth/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.logout(token)

    def ActionTodoAuthCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/todo/auth/current/get
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

        return self.auth_business.get_current_user(token)
