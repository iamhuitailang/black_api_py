from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class UpdateUserStatusRequest(BaseModel):
    user_id: int = Field(..., description="用户ID")
    status: int = Field(..., description="用户状态")


class DeleteUserRequest(BaseModel):
    user_id: int = Field(..., description="用户ID")


class HepingAdminController:
    def __init__(self):
        from app.business.heping.admin_business import HepingAdminBusiness
        self.admin_business = HepingAdminBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionHepingAdminLoginPost(self, request: Request, body: AdminLoginRequest):
        return self.admin_business.login(
            username=body.username,
            password=body.password
        )

    def ActionHepingAdminLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        return self.admin_business.logout(token)

    def ActionHepingAdminCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }
        return self.admin_business.get_current_admin(token)

    def ActionHepingAdminUserListGet(self, request: Request,
                                      page: int = Query(1, ge=1, description="页码"),
                                      page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                      keyword: Optional[str] = Query(None, description="搜索关键词"),
                                      status: Optional[int] = Query(None, description="用户状态"),
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }
        return self.admin_business.get_user_list(
            page=page,
            page_size=page_size,
            keyword=keyword,
            status=status
        )

    def ActionHepingAdminUserStatusUpdatePost(self, request: Request, body: UpdateUserStatusRequest,
                                               authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }
        return self.admin_business.update_user_status(
            user_id=body.user_id,
            status=body.status
        )

    def ActionHepingAdminUserDeletePost(self, request: Request, body: DeleteUserRequest,
                                         authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }
        return self.admin_business.delete_user(user_id=body.user_id)
