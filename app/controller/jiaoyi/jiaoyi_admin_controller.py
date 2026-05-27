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


class JiaoyiAdminController:
    def __init__(self):
        from app.business.jiaoyi import JiaoyiAdminBusiness
        self.admin_business = JiaoyiAdminBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionJiaoyiAdminLoginPost(self, request: Request, body: AdminLoginRequest):
        return self.admin_business.login(
            username=body.username,
            password=body.password
        )

    def ActionJiaoyiAdminLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        return self.admin_business.logout(token)

    def ActionJiaoyiAdminCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.get_current_admin(token)

    def ActionJiaoyiAdminPasswordChangePost(self, request: Request, body: AdminChangePasswordRequest,
                                              authorization: Optional[str] = Header(None)):
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

    def ActionJiaoyiAdminListGet(self, request: Request, page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量"),
                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.get_admin_list(page, page_size)

    def ActionJiaoyiAdminCreatePost(self, request: Request, body: CreateAdminRequest,
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin or admin.get('role') != 'super':
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        return self.admin_business.create_admin(
            username=body.username,
            password=body.password,
            nickname=body.nickname or ''
        )

    def ActionJiaoyiAdminDeletePost(self, request: Request, admin_id: int = Query(..., description="管理员ID"),
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin or admin.get('role') != 'super':
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        return self.admin_business.delete_admin(admin_id, admin.get('id'))
