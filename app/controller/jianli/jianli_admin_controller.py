from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class AdminChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class CreateAdminRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")
    role: Optional[str] = Field('normal', description="角色")


class JianliAdminController:
    def __init__(self):
        from app.business.jianli.admin_business import AdminBusiness
        self.admin_business = AdminBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionJianliAdminLoginPost(self, request: Request, body: AdminLoginRequest):
        """
        管理员登录接口
        POST /api/jianli/admin/login
        用户名密码登录，返回管理员信息和token
        """
        return self.admin_business.login(
            username=body.username,
            password=body.password
        )

    def ActionJianliAdminLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        管理员登出接口
        POST /api/jianli/admin/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.admin_business.logout(token)

    def ActionJianliAdminCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前管理员信息接口
        GET /api/jianli/admin/current/get
        根据token获取当前登录管理员信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': admin
        }

    def ActionJianliAdminPasswordChangePost(self, request: Request, body: AdminChangePasswordRequest,
                                             authorization: Optional[str] = Header(None)):
        """
        修改管理员密码接口
        POST /api/jianli/admin/password/change
        验证原密码后修改为新密码
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.admin_business.change_password(
            admin_id=admin.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )

    def ActionJianliAdminListGet(self, request: Request, page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量"),
                                  status: Optional[int] = Query(None, description="状态"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取管理员列表接口
        GET /api/jianli/admin/list/get
        分页获取管理员列表
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin or admin.get('role') != 'super':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.admin_business.get_admin_list(page, page_size, status)

    def ActionJianliAdminCreatePost(self, request: Request, body: CreateAdminRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        创建管理员接口
        POST /api/jianli/admin/create
        创建新管理员账号
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin or admin.get('role') != 'super':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.admin_business.create_admin(
            username=body.username,
            password=body.password,
            nickname=body.nickname or '',
            role=body.role or 'normal'
        )

    def ActionJianliAdminStatusUpdatePost(self, request: Request,
                                            admin_id: int = Query(..., description="管理员ID"),
                                            status: int = Query(..., description="状态"),
                                            authorization: Optional[str] = Header(None)):
        """
        更新管理员状态接口
        POST /api/jianli/admin/status/update
        启用或禁用管理员账号
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin or admin.get('role') != 'super':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.admin_business.update_admin_status(admin_id, status)

    def ActionJianliAdminDeletePost(self, request: Request,
                                      admin_id: int = Query(..., description="管理员ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        删除管理员接口
        POST /api/jianli/admin/delete
        删除指定管理员
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin or admin.get('role') != 'super':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.admin_business.delete_admin(admin_id)
