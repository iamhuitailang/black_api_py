from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    email: str = Field(..., description="邮箱")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")
    phone: Optional[str] = Field(None, description="手机号")


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    avatar: Optional[str] = Field(None, description="头像URL")
    phone: Optional[str] = Field(None, description="手机号")
    bio: Optional[str] = Field(None, description="个人简介")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class BqUserController:
    def __init__(self):
        from app.business.biaoqing_model.user_business import BqUserBusiness
        self.user_business = BqUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        if not token:
            return None
        try:
            return self.user_business.verify_token(token)
        except Exception:
            return None

    def ActionBqUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/bq/user/register
        新用户注册，返回用户信息和token
        """
        return self.user_business.register(
            username=body.username,
            email=body.email,
            password=body.password,
            nickname=body.nickname or '',
            phone=body.phone or ''
        )

    def ActionBqUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/bq/user/login
        用户名密码登录，返回用户信息和token
        """
        return self.user_business.login(
            username=body.username,
            password=body.password
        )

    def ActionBqUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/bq/user/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionBqUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/bq/user/current/get
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

    def ActionBqUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/bq/user/profile/update
        更新昵称、头像、手机号、个人简介等个人资料
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
        if body.phone is not None:
            data['phone'] = body.phone
        if body.bio is not None:
            data['bio'] = body.bio

        return self.user_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionBqUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/bq/user/password/change
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

    def ActionBqUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID"),
                               authorization: Optional[str] = Header(None)):
        """
        获取用户详情接口
        GET /api/bq/user/detail/get
        根据用户ID获取公开的用户信息
        """
        return self.user_business.get_user_by_id(user_id)

    def ActionBqUserListGet(self, request: Request, page: int = Query(1, description="页码"),
                            page_size: int = Query(10, description="每页数量"),
                            status: Optional[int] = Query(None, description="用户状态"),
                            role: Optional[int] = Query(None, description="用户角色"),
                            keyword: Optional[str] = Query(None, description="搜索关键词"),
                            authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口（管理员）
        GET /api/bq/user/list/get
        分页获取用户列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.user_business.get_user_list(
            page=page,
            page_size=page_size,
            status=status,
            role=role,
            keyword=keyword
        )

    def ActionBqUserStatusUpdatePost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                      status: int = Query(..., description="用户状态"),
                                      authorization: Optional[str] = Header(None)):
        """
        更新用户状态接口（管理员）
        POST /api/bq/user/status/update
        禁用/启用用户账号
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.user_business.update_user_status(user_id, status)

    def ActionBqUserSignInPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户签到接口
        POST /api/bq/user/sign/in
        每日签到获取积分
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.sign_in(user.get('id'))

    def ActionBqUserPointLogsGet(self, request: Request, page: int = Query(1, description="页码"),
                                 page_size: int = Query(20, description="每页数量"),
                                 type: Optional[int] = Query(None, description="积分类型"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取用户积分记录接口
        GET /api/bq/user/point/logs/get
        获取用户的积分变动记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_point_logs(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            type=type
        )
