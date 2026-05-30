from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class CreateAdminRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    real_name: Optional[str] = Field(None, description="真实姓名")
    role: Optional[str] = Field('normal', description="角色: super/normal")


class UpdateAdminProfileRequest(BaseModel):
    real_name: Optional[str] = Field(None, description="真实姓名")
    avatar: Optional[str] = Field(None, description="头像URL")


class AdminChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class ShiwuAdminController:
    def __init__(self):
        from app.business.shiwu.admin_business import AdminBusiness
        from app.business.shiwu.user_business import UserBusiness
        from app.business.shiwu.post_business import PostBusiness
        self.admin_business = AdminBusiness()
        self.user_business = UserBusiness()
        self.post_business = PostBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionShiwuAdminLoginPost(self, request: Request, body: AdminLoginRequest):
        """
        管理员登录接口
        POST /api/shiwu/admin/login
        用户名密码登录，返回管理员信息和token
        """
        return self.admin_business.login(
            username=body.username,
            password=body.password
        )

    def ActionShiwuAdminLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        管理员登出接口
        POST /api/shiwu/admin/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.admin_business.logout(token)

    def ActionShiwuAdminCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前管理员信息接口
        GET /api/shiwu/admin/current/get
        根据token获取当前登录管理员信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.get_current_admin(token)

    def ActionShiwuAdminCreatePost(self, request: Request, body: CreateAdminRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        创建管理员接口
        POST /api/shiwu/admin/create
        超级管理员创建新管理员
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.create_admin(
            current_admin_id=admin.get('id'),
            username=body.username,
            password=body.password,
            real_name=body.real_name or '',
            role=body.role or 'normal'
        )

    def ActionShiwuAdminProfileUpdatePost(self, request: Request, body: UpdateAdminProfileRequest,
                                           authorization: Optional[str] = Header(None)):
        """
        更新管理员资料接口
        POST /api/shiwu/admin/profile/update
        更新管理员个人资料
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.real_name is not None:
            data['real_name'] = body.real_name
        if body.avatar is not None:
            data['avatar'] = body.avatar

        return self.admin_business.update_profile(
            admin_id=admin.get('id'),
            data=data
        )

    def ActionShiwuAdminPasswordChangePost(self, request: Request, body: AdminChangePasswordRequest,
                                            authorization: Optional[str] = Header(None)):
        """
        修改管理员密码接口
        POST /api/shiwu/admin/password/change
        验证原密码后修改为新密码
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.change_password(
            admin_id=admin.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )

    def ActionShiwuAdminListGet(self, request: Request,
                                 page: int = Query(1, ge=1, description="页码"),
                                 page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                 status: Optional[int] = Query(None, description="状态"),
                                 role: Optional[str] = Query(None, description="角色"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取管理员列表接口
        GET /api/shiwu/admin/list/get
        分页获取管理员列表
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.get_admin_list(
            page=page,
            page_size=page_size,
            status=status,
            role=role
        )

    def ActionShiwuAdminStatusUpdatePost(self, request: Request,
                                          admin_id: int = Query(..., description="管理员ID"),
                                          status: int = Query(..., description="状态"),
                                          authorization: Optional[str] = Header(None)):
        """
        更新管理员状态接口
        POST /api/shiwu/admin/status/update
        启用/禁用管理员账号
        """
        token = self._get_token_from_header(request, authorization)
        current_admin = self._get_current_admin(token)

        if not current_admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.update_admin_status(
            current_admin_id=current_admin.get('id'),
            admin_id=admin_id,
            status=status
        )

    def ActionShiwuAdminDeletePost(self, request: Request,
                                    admin_id: int = Query(..., description="管理员ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        删除管理员接口
        POST /api/shiwu/admin/delete
        超级管理员删除管理员账号
        """
        token = self._get_token_from_header(request, authorization)
        current_admin = self._get_current_admin(token)

        if not current_admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.delete_admin(
            current_admin_id=current_admin.get('id'),
            admin_id=admin_id
        )

    def ActionShiwuAdminUserListGet(self, request: Request,
                                     page: int = Query(1, ge=1, description="页码"),
                                     page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                     status: Optional[int] = Query(None, description="状态"),
                                     college: Optional[str] = Query(None, description="学院"),
                                     keyword: Optional[str] = Query(None, description="搜索关键词"),
                                     authorization: Optional[str] = Header(None)):
        """
        管理员获取用户列表接口
        GET /api/shiwu/admin/user/list/get
        分页获取所有用户列表
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_list(
            page=page,
            page_size=page_size,
            status=status,
            college=college,
            keyword=keyword
        )

    def ActionShiwuAdminUserStatusUpdatePost(self, request: Request,
                                              user_id: int = Query(..., description="用户ID"),
                                              status: int = Query(..., description="状态"),
                                              authorization: Optional[str] = Header(None)):
        """
        更新用户状态接口
        POST /api/shiwu/admin/user/status/update
        启用/禁用用户账号
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.update_user_status(
            user_id=user_id,
            status=status
        )

    def ActionShiwuAdminUserDeletePost(self, request: Request,
                                        user_id: int = Query(..., description="用户ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        删除用户接口
        POST /api/shiwu/admin/user/delete
        管理员删除用户账号
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.delete_user(
            user_id=user_id
        )

    def ActionShiwuAdminPostVerifyPost(self, request: Request,
                                        post_id: int = Query(..., description="信息ID"),
                                        verify_status: int = Query(..., description="审核状态"),
                                        authorization: Optional[str] = Header(None)):
        """
        审核信息接口
        POST /api/shiwu/admin/post/verify
        管理员审核发布的信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.verify_post(
            admin_id=admin.get('id'),
            post_id=post_id,
            verify_status=verify_status
        )

    def ActionShiwuAdminPostTopSetPost(self, request: Request,
                                        post_id: int = Query(..., description="信息ID"),
                                        is_top: int = Query(..., description="是否置顶"),
                                        authorization: Optional[str] = Header(None)):
        """
        设置信息置顶接口
        POST /api/shiwu/admin/post/top/set
        管理员设置信息置顶
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.set_top(
            admin_id=admin.get('id'),
            post_id=post_id,
            is_top=is_top
        )

    def ActionShiwuAdminPostDeletePost(self, request: Request,
                                        post_id: int = Query(..., description="信息ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        删除信息接口
        POST /api/shiwu/admin/post/delete
        管理员删除违规信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.admin_delete_post(
            admin_id=admin.get('id'),
            post_id=post_id
        )

    def ActionShiwuAdminClaimListGet(self, request: Request,
                                      page: int = Query(1, ge=1, description="页码"),
                                      page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                      status: Optional[int] = Query(None, description="状态"),
                                      authorization: Optional[str] = Header(None)):
        """
        管理员获取所有认领申请接口
        GET /api/shiwu/admin/claim/list/get
        管理员查看所有认领申请
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        from app.business.shiwu.claim_business import ClaimBusiness
        claim_business = ClaimBusiness()
        return claim_business.get_all_claims(
            page=page,
            page_size=page_size,
            status=status
        )
