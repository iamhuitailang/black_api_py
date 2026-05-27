from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")
    role: Optional[str] = Field('student', description="角色：student/staff")
    nickname: Optional[str] = Field(None, description="昵称")
    department_id: Optional[int] = Field(0, description="部门ID")


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    avatar: Optional[str] = Field(None, description="头像URL")
    department_id: Optional[int] = Field(None, description="部门ID")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class TousuUserController:
    def __init__(self):
        from app.business.tousu.user_business import TousuUserBusiness
        self.user_business = TousuUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionTousuUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/tousu/user/register
        """
        return self.user_business.register(
            username=body.username,
            phone=body.phone,
            password=body.password,
            role=body.role or 'student',
            nickname=body.nickname or '',
            department_id=body.department_id or 0
        )

    def ActionTousuUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/tousu/user/login
        """
        return self.user_business.login(
            username=body.username,
            password=body.password
        )

    def ActionTousuUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/tousu/user/logout
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionTousuUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/tousu/user/current/get
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

    def ActionTousuUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/tousu/user/profile/update
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
        if body.department_id is not None:
            data['department_id'] = body.department_id

        return self.user_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionTousuUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                          authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/tousu/user/password/change
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

    def ActionTousuUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取用户详情接口
        GET /api/tousu/user/detail/get
        """
        return self.user_business.get_user_by_id(user_id)

    def ActionTousuUserListGet(self, request: Request,
                               page: int = Query(1, description="页码"),
                               page_size: int = Query(10, description="每页数量"),
                               role: Optional[str] = Query(None, description="角色"),
                               status: Optional[int] = Query(None, description="状态"),
                               keyword: Optional[str] = Query(None, description="关键词"),
                               authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口
        GET /api/tousu/user/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_list(page, page_size, role, status, keyword)