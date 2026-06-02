from typing import Optional
from fastapi import Request, Header, Query
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


class PoanUserController:
    def __init__(self):
        from app.business.poan.user_business import PoanUserBusiness
        self.user_business = PoanUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionPoanUserRegisterPost(self, request: Request, body: RegisterRequest):
        return self.user_business.register(
            username=body.username,
            password=body.password,
            nickname=body.nickname or ''
        )

    def ActionPoanUserLoginPost(self, request: Request, body: LoginRequest):
        return self.user_business.login(
            username=body.username,
            password=body.password
        )

    def ActionPoanUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionPoanUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_by_id(user.get('id'))

    def ActionPoanUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                         authorization: Optional[str] = Header(None)):
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

        return self.user_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionPoanUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                          authorization: Optional[str] = Header(None)):
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

    def ActionPoanUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                 authorization: Optional[str] = Header(None)):
        return self.user_business.get_user_by_id(user_id)

    def ActionPoanUserListGet(self, request: Request,
                               page: int = Query(1, ge=1, description="页码"),
                               page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                               status: Optional[int] = Query(None, description="状态"),
                               keyword: Optional[str] = Query(None, description="搜索关键词")):
        return self.user_business.get_user_list(
            page=page,
            page_size=page_size,
            status=status,
            keyword=keyword
        )
