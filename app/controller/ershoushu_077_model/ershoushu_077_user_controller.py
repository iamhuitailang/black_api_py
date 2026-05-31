from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
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
    new_password: str = Field(..., description="新密码")


class ErshoushuUserController:
    def __init__(self):
        from app.business.ershoushu_077_model.user_business import ErshoushuUserBusiness
        self.user_business = ErshoushuUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionErshoushuUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/ershoushu/user/register
        """
        return self.user_business.register(
            username=body.username,
            password=body.password,
            nickname=body.nickname or '',
            phone=body.phone or ''
        )

    def ActionErshoushuUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/ershoushu/user/login
        """
        return self.user_business.login(
            username=body.username,
            password=body.password
        )

    def ActionErshoushuUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/ershoushu/user/logout
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionErshoushuUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/ershoushu/user/current/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.get_user_by_id(user.get('id'))

    def ActionErshoushuUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                              authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/ershoushu/user/profile/update
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        data = {}
        if body.nickname is not None:
            data['nickname'] = body.nickname
        if body.phone is not None:
            data['phone'] = body.phone
        if body.avatar is not None:
            data['avatar'] = body.avatar
        return self.user_business.update_profile(user_id=user.get('id'), data=data)

    def ActionErshoushuUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                               authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/ershoushu/user/password/change
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.change_password(
            user_id=user.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )

    def ActionErshoushuUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID")):
        """
        获取用户详情接口
        GET /api/ershoushu/user/detail/get
        """
        return self.user_business.get_user_by_id(user_id)

    def ActionErshoushuUserListGet(self, request: Request,
                                    page: int = Query(1, ge=1, description="页码"),
                                    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                    role: Optional[str] = Query(None, description="角色"),
                                    status: Optional[int] = Query(None, description="状态"),
                                    keyword: Optional[str] = Query(None, description="搜索关键词"),
                                    authorization: Optional[str] = Header(None)):
        """
        管理员获取用户列表接口
        GET /api/ershoushu/user/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        if user.get('role') != 'admin':
            return {'code': 1, 'msg': '无权限', 'data': None}
        return self.user_business.get_user_list(page, page_size, role, status, keyword)

    def ActionErshoushuUserMutePost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        禁言用户接口
        POST /api/ershoushu/user/mute
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        if user.get('role') != 'admin':
            return {'code': 1, 'msg': '无权限', 'data': None}
        return self.user_business.mute_user(user_id)

    def ActionErshoushuUserBanPost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        封号用户接口
        POST /api/ershoushu/user/ban
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        if user.get('role') != 'admin':
            return {'code': 1, 'msg': '无权限', 'data': None}
        return self.user_business.ban_user(user_id)

    def ActionErshoushuUserUnbanPost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        解封用户接口
        POST /api/ershoushu/user/unban
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        if user.get('role') != 'admin':
            return {'code': 1, 'msg': '无权限', 'data': None}
        return self.user_business.unban_user(user_id)
