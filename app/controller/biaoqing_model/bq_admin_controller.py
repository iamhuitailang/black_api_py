from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class CreateAdminRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field('', description="昵称")
    avatar: Optional[str] = Field('', description="头像")
    role: Optional[int] = Field(1, description="角色")


class ChangeAdminPasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class BqAdminController:
    def __init__(self):
        from app.business.biaoqing_model.admin_business import BqAdminBusiness
        self.admin_business = BqAdminBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionBqAdminLoginPost(self, request: Request, body: AdminLoginRequest):
        """
        管理员登录接口
        POST /api/bq/admin/login
        管理员登录，返回管理员信息和token
        """
        client_ip = request.client.host if request.client else ''
        return self.admin_business.login(
            username=body.username,
            password=body.password,
            ip=client_ip
        )

    def ActionBqAdminLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        管理员登出接口
        POST /api/bq/admin/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.admin_business.logout(token)

    def ActionBqAdminCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前管理员信息接口
        GET /api/bq/admin/current/get
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

    def ActionBqAdminCreatePost(self, request: Request, body: CreateAdminRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        创建管理员接口（超级管理员）
        POST /api/bq/admin/create
        创建新的管理员账号
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
            username=body.username,
            password=body.password,
            nickname=body.nickname or '',
            avatar=body.avatar or '',
            role=body.role or 1,
            current_admin_role=admin.get('role', 0)
        )

    def ActionBqAdminListGet(self, request: Request, page: int = Query(1, description="页码"),
                              page_size: int = Query(10, description="每页数量"),
                              status: Optional[int] = Query(None, description="状态"),
                              role: Optional[int] = Query(None, description="角色"),
                              keyword: Optional[str] = Query(None, description="搜索关键词"),
                              authorization: Optional[str] = Header(None)):
        """
        获取管理员列表接口
        GET /api/bq/admin/list/get
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
            role=role,
            keyword=keyword
        )

    def ActionBqAdminStatusUpdatePost(self, request: Request, admin_id: int = Query(..., description="管理员ID"),
                                       status: int = Query(..., description="状态"),
                                       authorization: Optional[str] = Header(None)):
        """
        更新管理员状态接口（超级管理员）
        POST /api/bq/admin/status/update
        禁用/启用管理员账号
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.update_admin_status(
            admin_id=admin_id,
            status=status,
            current_admin_role=admin.get('role', 0)
        )

    def ActionBqAdminPasswordChangePost(self, request: Request, body: ChangeAdminPasswordRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        修改管理员密码接口
        POST /api/bq/admin/password/change
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

        return self.admin_business.update_password(
            admin_id=admin.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )

    def ActionBqAdminDeletePost(self, request: Request, admin_id: int = Query(..., description="管理员ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        删除管理员接口（超级管理员）
        POST /api/bq/admin/delete
        删除指定管理员账号
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.delete_admin(
            admin_id=admin_id,
            current_admin_role=admin.get('role', 0)
        )
