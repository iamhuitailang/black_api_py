from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    phone: str = Field(..., description="账号/手机号")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")


class LoginRequest(BaseModel):
    phone: str = Field(..., description="账号/手机号")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    avatar: Optional[str] = Field(None, description="头像URL")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class UpdateUserStatusRequest(BaseModel):
    user_id: int = Field(..., description="用户ID")
    status: int = Field(..., description="状态")


class JieyongAuthController:
    def __init__(self):
        from app.business.jieyong_model.auth_business import JieyongAuthBusiness
        self.auth_business = JieyongAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def _require_admin(self, token: str) -> Optional[dict]:
        user = self._get_current_user(token)
        if not user:
            return None
        if not self.auth_business.is_admin(user.get('id')):
            return None
        return user

    def ActionJieyongAuthRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/jieyong_model/auth/register
        新用户注册，返回用户信息和token
        """
        return self.auth_business.register(
            phone=body.phone,
            password=body.password,
            nickname=body.nickname or ''
        )

    def ActionJieyongAuthLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/jieyong_model/auth/login
        账号密码登录，返回用户信息和token
        """
        return self.auth_business.login(
            phone=body.phone,
            password=body.password
        )

    def ActionJieyongAuthLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/jieyong_model/auth/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.logout(token)

    def ActionJieyongAuthCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/jieyong_model/auth/current/get
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

        return self.auth_business.get_user_by_id(user.get('id'))

    def ActionJieyongAuthProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                            authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/jieyong_model/auth/profile/update
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

        return self.auth_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionJieyongAuthPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                             authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/jieyong_model/auth/password/change
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

    def ActionJieyongAuthUserListGet(self, request: Request,
                                      page: int = Query(1, description="页码"),
                                      page_size: int = Query(10, description="每页数量"),
                                      status: Optional[int] = Query(None, description="状态"),
                                      role: Optional[str] = Query(None, description="角色"),
                                      keyword: Optional[str] = Query(None, description="关键词"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口（管理员）
        GET /api/jieyong_model/auth/user/list/get
        分页获取用户列表，支持筛选
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.auth_business.get_user_list(
            page=page,
            page_size=page_size,
            status=status,
            role=role,
            keyword=keyword
        )

    def ActionJieyongAuthUserStatusUpdatePost(self, request: Request, body: UpdateUserStatusRequest,
                                               authorization: Optional[str] = Header(None)):
        """
        更新用户状态接口（管理员）
        POST /api/jieyong_model/auth/user/status/update
        启用或禁用用户账号
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.auth_business.update_user_status(
            user_id=body.user_id,
            status=body.status
        )
