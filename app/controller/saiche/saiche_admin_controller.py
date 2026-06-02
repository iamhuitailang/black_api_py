from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class SaicheAdminController:
    def __init__(self):
        from app.business.saiche.admin_business import SaicheAdminBusiness
        from app.business.saiche.user_business import SaicheUserBusiness
        self.admin_business = SaicheAdminBusiness()
        self.user_business = SaicheUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionSaicheAdminLoginPost(self, request: Request, body: AdminLoginRequest):
        """
        管理员登录接口
        POST /api/saiche/admin/login
        管理员账号密码登录
        """
        return self.admin_business.login(
            username=body.username,
            password=body.password
        )

    def ActionSaicheAdminLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        管理员登出接口
        POST /api/saiche/admin/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.admin_business.logout(token)

    def ActionSaicheAdminStatsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取统计数据接口
        GET /api/saiche/admin/stats/get
        获取游戏统计数据
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.get_stats()

    def ActionSaicheAdminUserListGet(self, request: Request,
                                      page: int = Query(1, ge=1, description="页码"),
                                      page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                      status: Optional[int] = Query(None, description="用户状态"),
                                      keyword: Optional[str] = Query(None, description="搜索关键词"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口
        GET /api/saiche/admin/user/list/get
        管理员获取用户列表
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.get_user_list(
            page=page,
            page_size=page_size,
            status=status,
            keyword=keyword
        )

    def ActionSaicheAdminUserBanPost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        封禁用户接口
        POST /api/saiche/admin/user/ban
        管理员封禁用户
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.ban_user(user_id=user_id)

    def ActionSaicheAdminUserUnbanPost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        解封用户接口
        POST /api/saiche/admin/user/unban
        管理员解封用户
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.unban_user(user_id=user_id)
