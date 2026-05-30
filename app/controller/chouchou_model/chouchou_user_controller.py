from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名", min_length=3, max_length=20)
    password: str = Field(..., description="密码", min_length=6)
    nickname: Optional[str] = Field(None, description="昵称")
    phone: Optional[str] = Field(None, description="手机号")


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    phone: Optional[str] = Field(None, description="手机号")
    avatar: Optional[str] = Field(None, description="头像URL")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码", min_length=6)


class DeleteUserRequest(BaseModel):
    user_id: int = Field(..., description="用户ID")


class ChouchouUserController:
    def __init__(self):
        from app.business.chouchou_model import UserBusiness
        self.user_business = UserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization:
            if authorization.startswith('Bearer '):
                return authorization[7:]
            return authorization

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionChouchouUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/chouchou_model/user/register
        新用户注册，返回用户信息和token
        """
        return self.user_business.register(
            username=body.username,
            password=body.password,
            nickname=body.nickname or '',
            phone=body.phone or ''
        )

    def ActionChouchouUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/chouchou_model/user/login
        用户名密码登录，返回用户信息和token
        """
        return self.user_business.login(
            username=body.username,
            password=body.password
        )

    def ActionChouchouUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/chouchou_model/user/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionChouchouUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/chouchou_model/user/current/get
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

    def ActionChouchouUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                             authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/chouchou_model/user/profile/update
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

        return self.user_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionChouchouUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                              authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/chouchou_model/user/password/change
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

    def ActionChouchouUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取用户详情接口
        GET /api/chouchou_model/user/detail/get
        根据用户ID获取公开的用户信息
        """
        return self.user_business.get_user_by_id(user_id)

    def ActionChouchouUserListGet(self, request: Request, page: int = Query(1, description="页码"),
                                   page_size: int = Query(10, description="每页数量"),
                                   status: Optional[int] = Query(None, description="用户状态"),
                                   keyword: Optional[str] = Query(None, description="搜索关键词"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口
        GET /api/chouchou_model/user/list/get
        分页获取用户列表，支持搜索
        """
        return self.user_business.get_user_list(
            page=page,
            page_size=page_size,
            status=status,
            keyword=keyword
        )

    def ActionChouchouUserRankingsGet(self, request: Request, limit: int = Query(10, description="数量"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取用户排行榜接口
        GET /api/chouchou_model/user/rankings/get
        按总积分排名的用户列表
        """
        return self.user_business.get_rankings(limit=limit)

    def ActionChouchouUserDeletePost(self, request: Request, body: DeleteUserRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        删除用户接口
        POST /api/chouchou_model/user/delete
        删除指定用户（需要管理员权限）
        """
        token = self._get_token_from_header(request, authorization)
        current_user = self._get_current_user(token)

        if not current_user or current_user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.user_business.delete_user(body.user_id)
