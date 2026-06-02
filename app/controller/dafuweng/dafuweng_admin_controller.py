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


class AdminChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class AdminStatusUpdateRequest(BaseModel):
    admin_id: int = Field(..., description="管理员ID")
    status: int = Field(..., description="状态")


class UserStatusUpdateRequest(BaseModel):
    user_id: int = Field(..., description="用户ID")
    status: int = Field(..., description="状态")


class DafuwengAdminController:
    def __init__(self):
        from app.business.dafuweng.admin_business import DafuwengAdminBusiness
        self.admin_business = DafuwengAdminBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def _verify_admin(self, token):
        from app.business.dafuweng.admin_business import DafuwengAdminBusiness
        business = DafuwengAdminBusiness()
        admin = business.verify_token(token)
        if not admin:
            return {'code': 1, 'msg': '管理员未登录', 'data': None}
        return None

    def ActionDafuwengAdminLoginPost(self, request: Request, body: AdminLoginRequest):
        return self.admin_business.login(
            username=body.username,
            password=body.password
        )

    def ActionDafuwengAdminLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        return self.admin_business.logout(token)

    def ActionDafuwengAdminCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.get_current_admin(token)

    def ActionDafuwengAdminPasswordChangePost(self, request: Request, body: AdminChangePasswordRequest,
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

    def ActionDafuwengAdminListGet(self, request: Request,
                                    page: int = Query(1, ge=1, description="页码"),
                                    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        verify = self._verify_admin(token)
        if verify:
            return verify

        return self.admin_business.get_admin_list(page=page, page_size=page_size)

    def ActionDafuwengAdminCreatePost(self, request: Request, body: CreateAdminRequest,
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        verify = self._verify_admin(token)
        if verify:
            return verify

        return self.admin_business.create_admin(
            username=body.username,
            password=body.password,
            real_name=body.real_name or ''
        )

    def ActionDafuwengAdminStatusUpdatePost(self, request: Request, body: AdminStatusUpdateRequest,
                                              authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        verify = self._verify_admin(token)
        if verify:
            return verify

        return self.admin_business.update_status(
            admin_id=body.admin_id,
            status=body.status
        )

    def ActionDafuwengAdminUserListGet(self, request: Request,
                                        page: int = Query(1, ge=1, description="页码"),
                                        page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                        keyword: Optional[str] = Query(None, description="搜索关键词"),
                                        authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        verify = self._verify_admin(token)
        if verify:
            return verify

        from app.business.dafuweng.user_business import DafuwengUserBusiness
        user_business = DafuwengUserBusiness()
        return user_business.get_user_list(page=page, page_size=page_size, keyword=keyword)

    def ActionDafuwengAdminUserStatusUpdatePost(self, request: Request, body: UserStatusUpdateRequest,
                                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        verify = self._verify_admin(token)
        if verify:
            return verify

        from app.business.dafuweng.user_business import DafuwengUserBusiness
        user_business = DafuwengUserBusiness()
        user = user_business.user_model.get_by_id(body.user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}
        user_business.user_model.update_status(body.user_id, body.status)
        updated = user_business.user_model.get_by_id(body.user_id)
        return {'code': 0, 'msg': '更新成功', 'data': user_business.user_model.to_public_dict(updated)}
