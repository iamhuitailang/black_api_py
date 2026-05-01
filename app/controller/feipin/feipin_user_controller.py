from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")
    role: Optional[str] = Field('user', description="角色：user/collector")
    nickname: Optional[str] = Field(None, description="昵称")


class LoginRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    avatar: Optional[str] = Field(None, description="头像URL")


class ApplyCollectorRequest(BaseModel):
    id_card: str = Field(..., description="身份证号")
    id_card_photo: str = Field(..., description="身份证照片URL")


class FeipinUserController:
    def __init__(self):
        from app.business.feipin.user_business import FeipinUserBusiness
        self.user_business = FeipinUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionFeipinUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/feipin/user/register
        新用户注册，支持普通用户和回收员注册
        """
        return self.user_business.register(
            phone=body.phone,
            password=body.password,
            role=body.role or 'user',
            nickname=body.nickname or ''
        )

    def ActionFeipinUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/feipin/user/login
        手机号密码登录，返回用户信息和token
        """
        return self.user_business.login(
            phone=body.phone,
            password=body.password
        )

    def ActionFeipinUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/feipin/user/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionFeipinUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/feipin/user/current/get
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

    def ActionFeipinUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                            authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/feipin/user/profile/update
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

    def ActionFeipinUserApplyCollectorPost(self, request: Request, body: ApplyCollectorRequest,
                                             authorization: Optional[str] = Header(None)):
        """
        申请成为回收员接口
        POST /api/feipin/user/apply/collector
        提交身份证信息申请成为回收员
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.apply_collector(
            user_id=user.get('id'),
            id_card=body.id_card,
            id_card_photo=body.id_card_photo
        )

    def ActionFeipinUserCollectorsGet(self, request: Request, page: int = Query(1, description="页码"),
                                        page_size: int = Query(10, description="每页数量")):
        """
        获取回收员列表接口
        GET /api/feipin/user/collectors/get
        获取所有已审核通过的回收员列表
        """
        return self.user_business.get_collectors(page=page, page_size=page_size)

    def ActionFeipinUserListGet(self, request: Request, page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量"),
                                  role: Optional[str] = Query(None, description="角色筛选"),
                                  status: Optional[int] = Query(None, description="状态筛选"),
                                  keyword: Optional[str] = Query(None, description="关键词搜索"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口（管理端）
        GET /api/feipin/user/list/get
        管理端获取所有用户列表
        """
        return self.user_business.get_user_list(
            page=page,
            page_size=page_size,
            role=role,
            status=status,
            keyword=keyword
        )

    def ActionFeipinUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID")):
        """
        获取用户详情接口
        GET /api/feipin/user/detail/get
        根据用户ID获取用户信息
        """
        return self.user_business.get_user_by_id(user_id)

    def ActionFeipinUserVerifyCollectorPost(self, request: Request,
                                              user_id: int = Query(..., description="用户ID"),
                                              approved: bool = Query(..., description="是否通过"),
                                              note: Optional[str] = Query('', description="审核备注")):
        """
        审核回收员接口
        POST /api/feipin/user/verify/collector
        管理端审核回收员申请
        """
        return self.user_business.verify_collector(
            user_id=user_id,
            approved=approved,
            note=note
        )

    def ActionFeipinUserBanPost(self, request: Request, user_id: int = Query(..., description="用户ID")):
        """
        禁用用户接口
        POST /api/feipin/user/ban
        管理端禁用用户账号
        """
        return self.user_business.ban_user(user_id)

    def ActionFeipinUserUnbanPost(self, request: Request, user_id: int = Query(..., description="用户ID")):
        """
        启用用户接口
        POST /api/feipin/user/unban
        管理端启用用户账号
        """
        return self.user_business.unban_user(user_id)
