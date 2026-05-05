from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")


class LoginRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    avatar: Optional[str] = Field(None, description="头像URL")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class QdUserController:
    def __init__(self):
        from app.business.qd.sign_user_business import SignUserBusiness
        self.user_business = SignUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionQdUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/qd/user/register
        新用户注册，返回用户信息和token
        """
        return self.user_business.register(
            phone=body.phone,
            password=body.password,
            nickname=body.nickname or ''
        )

    def ActionQdUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/qd/user/login
        手机号密码登录，返回用户信息和token
        """
        return self.user_business.login(
            phone=body.phone,
            password=body.password
        )

    def ActionQdUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/qd/user/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionQdUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/qd/user/current/get
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

    def ActionQdUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/qd/user/profile/update
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

        return self.user_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionQdUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/qd/user/password/change
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

    def ActionQdUserListGet(self, request: Request,
                             page: int = Query(1, description="页码"),
                             page_size: int = Query(10, description="每页数量"),
                             status: Optional[int] = Query(None, description="用户状态"),
                             keyword: Optional[str] = Query(None, description="搜索关键词")):
        """
        获取用户列表接口
        GET /api/qd/user/list/get
        分页获取用户列表
        """
        return self.user_business.get_user_list(
            page=page,
            page_size=page_size,
            status=status,
            keyword=keyword
        )
