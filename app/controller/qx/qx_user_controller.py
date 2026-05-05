from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")
    avatar: Optional[str] = Field(None, description="头像URL")
    bike_type: Optional[str] = Field(None, description="车辆类型")
    bio: Optional[str] = Field(None, description="个人简介")


class LoginRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    avatar: Optional[str] = Field(None, description="头像URL")
    bike_type: Optional[str] = Field(None, description="车辆类型")
    bio: Optional[str] = Field(None, description="个人简介")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class QxUserController:
    def __init__(self):
        from app.business.qx.user_business import QxUserBusiness
        self.user_business = QxUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionQxUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/qx/user/register
        新用户注册，返回用户信息和token
        """
        return self.user_business.register(
            phone=body.phone,
            password=body.password,
            nickname=body.nickname or '',
            avatar=body.avatar or '',
            bike_type=body.bike_type or '',
            bio=body.bio or ''
        )

    def ActionQxUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/qx/user/login
        手机号密码登录，返回用户信息和token
        """
        return self.user_business.login(
            phone=body.phone,
            password=body.password
        )

    def ActionQxUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/qx/user/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionQxUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/qx/user/current/get
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

        return self.user_business.get_me(user.get('id'))

    def ActionQxUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/qx/user/profile/update
        更新昵称、头像、车辆类型等个人资料
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
        if body.bike_type is not None:
            data['bike_type'] = body.bike_type
        if body.bio is not None:
            data['bio'] = body.bio

        return self.user_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionQxUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/qx/user/password/change
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

    def ActionQxUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID"),
                               authorization: Optional[str] = Header(None)):
        """
        获取用户详情接口
        GET /api/qx/user/detail/get
        根据用户ID获取公开的用户信息
        """
        return self.user_business.get_user_by_id(user_id)

    def ActionQxUserListGet(self, request: Request, page: int = Query(1, description="页码"),
                             page_size: int = Query(10, description="每页数量"),
                             status: Optional[int] = Query(None, description="状态"),
                             level: Optional[str] = Query(None, description="等级"),
                             keyword: Optional[str] = Query(None, description="搜索关键词"),
                             authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口
        GET /api/qx/user/list/get
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

        return self.user_business.get_user_list(
            page=page,
            page_size=page_size,
            status=status,
            level=level,
            keyword=keyword
        )

    def ActionQxUserRankingGet(self, request: Request, sort_by: str = Query('distance', description="排序方式"),
                                page: int = Query(1, description="页码"),
                                page_size: int = Query(10, description="每页数量")):
        """
        获取排行榜接口
        GET /api/qx/user/ranking/get
        获取里程榜、速度榜
        """
        return self.user_business.get_ranking(
            sort_by=sort_by,
            page=page,
            page_size=page_size
        )

    def ActionQxUserStatusUpdatePost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                      status: int = Query(..., description="状态"),
                                      authorization: Optional[str] = Header(None)):
        """
        更新用户状态接口
        POST /api/qx/user/status/update
        管理员更新用户状态（禁言、封号等）
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.update_user_status(
            user_id=user_id,
            status=status
        )
