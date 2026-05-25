from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    email: str = Field(..., description="邮箱")
    password: str = Field(..., description="密码")


class LoginRequest(BaseModel):
    account: str = Field(..., description="账号(用户名/邮箱)")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    username: Optional[str] = Field(None, description="用户名")
    email: Optional[str] = Field(None, description="邮箱")
    avatar: Optional[str] = Field(None, description="头像URL")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class XzAuthController:
    def __init__(self):
        from app.business.xiaozu.auth_business import XzAuthBusiness
        self.auth_business = XzAuthBusiness()

    def _get_token(self, request: Request, authorization: Optional[str]) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token or ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def ActionXzAuthRegisterPost(self, request: Request, body: RegisterRequest):
        """用户注册"""
        return self.auth_business.register(body.username, body.email, body.password)

    def ActionXzAuthLoginPost(self, request: Request, body: LoginRequest):
        """用户登录"""
        return self.auth_business.login(body.account, body.password)

    def ActionXzAuthLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """用户登出"""
        token = self._get_token(request, authorization)
        return self.auth_business.logout(token)

    def ActionXzAuthCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """获取当前用户"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return {'code': 0, 'msg': 'success', 'data': user}

    def ActionXzAuthProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                       authorization: Optional[str] = Header(None)):
        """更新个人资料"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        data = {}
        if body.username is not None:
            data['username'] = body.username
        if body.email is not None:
            data['email'] = body.email
        if body.avatar is not None:
            data['avatar'] = body.avatar

        return self.auth_business.update_profile(user['id'], data)

    def ActionXzAuthPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                        authorization: Optional[str] = Header(None)):
        """修改密码"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.auth_business.change_password(user['id'], body.old_password, body.new_password)

    def ActionXzAuthUserListGet(self, request: Request, page: int = Query(1, description="页码"),
                                 page_size: int = Query(10, description="每页数量"),
                                 keyword: Optional[str] = Query(None, description="关键词")):
        """获取用户列表"""
        return self.auth_business.get_user_list(page, page_size, keyword)

    def ActionXzAuthUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID")):
        """获取用户详情"""
        return self.auth_business.get_user_by_id(user_id)
