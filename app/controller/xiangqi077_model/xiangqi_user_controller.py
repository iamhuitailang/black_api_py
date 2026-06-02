from typing import Optional
from fastapi import Request, Header
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
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


class XiangqiUserController:
    def __init__(self):
        from app.business.xiangqi077_model.user_business import XiangqiUserBusiness
        self.user_business = XiangqiUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionXiangqiUserRegisterPost(self, request: Request, body: RegisterRequest):
        """用户注册"""
        return self.user_business.register(
            username=body.username,
            password=body.password,
            nickname=body.nickname or ''
        )

    def ActionXiangqiUserLoginPost(self, request: Request, body: LoginRequest):
        """用户登录"""
        return self.user_business.login(
            username=body.username,
            password=body.password
        )

    def ActionXiangqiUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """用户登出"""
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionXiangqiUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """获取当前用户信息"""
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.get_user_by_id(user.get('id'))

    def ActionXiangqiUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                            authorization: Optional[str] = Header(None)):
        """更新个人资料"""
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        data = {}
        if body.nickname is not None:
            data['nickname'] = body.nickname
        if body.avatar is not None:
            data['avatar'] = body.avatar
        return self.user_business.update_profile(user.get('id'), data)

    def ActionXiangqiUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                             authorization: Optional[str] = Header(None)):
        """修改密码"""
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.change_password(
            user_id=user.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )

    def ActionXiangqiUserDetailGet(self, request: Request, user_id: int,
                                    authorization: Optional[str] = Header(None)):
        """获取用户详情"""
        return self.user_business.get_user_by_id(user_id)
