from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")
    phone: Optional[str] = Field(None, description="手机号")
    role: Optional[int] = Field(0, description="角色：0用户 1管理员")


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    phone: Optional[str] = Field(None, description="手机号")
    avatar: Optional[str] = Field(None, description="头像URL")


class UpdateUserStatusRequest(BaseModel):
    user_id: int = Field(..., description="用户ID")
    status: int = Field(..., description="状态")


class JianshenAuthController:
    def __init__(self):
        from app.business.jianshen_077.auth_business import JianshenAuthBusiness
        self.auth_business = JianshenAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def ActionJianshenAuthRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/jianshen/auth/register
        新用户注册，返回用户信息和token
        """
        return self.auth_business.register(
            username=body.username,
            password=body.password,
            nickname=body.nickname or '',
            phone=body.phone or '',
            role=body.role or 0
        )

    def ActionJianshenAuthLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/jianshen/auth/login
        用户名密码登录，返回用户信息和token
        """
        return self.auth_business.login(
            username=body.username,
            password=body.password
        )

    def ActionJianshenAuthLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/jianshen/auth/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.logout(token)

    def ActionJianshenAuthCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/jianshen/auth/current/get
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

    def ActionJianshenAuthPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                              authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/jianshen/auth/password/change
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

        return self.auth_business.change_password(
            user_id=user.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )

    def ActionJianshenAuthProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                             authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/jianshen/auth/profile/update
        更新昵称、手机号、头像等个人资料
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
        if body.phone is not None:
            data['phone'] = body.phone
        if body.avatar is not None:
            data['avatar'] = body.avatar

        return self.auth_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionJianshenAuthUserListGet(self, request: Request,
                                       page: int = Query(1, ge=1, description="页码"),
                                       page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                       role: Optional[int] = Query(None, description="角色"),
                                       status: Optional[int] = Query(None, description="状态"),
                                       keyword: Optional[str] = Query(None, description="搜索关键词"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口
        GET /api/jianshen/auth/user/list/get
        管理员获取用户列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        return self.auth_business.get_user_list(
            page=page,
            page_size=page_size,
            role=role,
            status=status,
            keyword=keyword
        )

    def ActionJianshenAuthUserStatusUpdatePost(self, request: Request, body: UpdateUserStatusRequest,
                                                 authorization: Optional[str] = Header(None)):
        """
        更新用户状态接口
        POST /api/jianshen/auth/user/status/update
        管理员启用/禁用用户
        """
        token = self._get_token_from_header(request, authorization)
        current_user = self._get_current_user(token)

        if not current_user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if current_user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        return self.auth_business.update_user_status(body.user_id, body.status)
