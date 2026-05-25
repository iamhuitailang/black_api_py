from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class AdminChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class TucaoAdminController:
    def __init__(self):
        from app.business.tucao.admin_business import TucaoAdminBusiness
        from app.business.tucao.post_business import TucaoPostBusiness
        from app.business.tucao.user_business import TucaoUserBusiness
        self.admin_business = TucaoAdminBusiness()
        self.post_business = TucaoPostBusiness()
        self.user_business = TucaoUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionTucaoAdminLoginPost(self, request: Request, body: AdminLoginRequest):
        """
        管理员登录接口
        POST /api/tucao/admin/login
        """
        return self.admin_business.login(
            username=body.username,
            password=body.password
        )

    def ActionTucaoAdminLogoutPost(self, request: Request,
                                   authorization: Optional[str] = Header(None)):
        """
        管理员退出登录接口
        POST /api/tucao/admin/logout
        """
        token = self._get_token_from_header(request, authorization)
        return self.admin_business.logout(token)

    def ActionTucaoAdminInfoGet(self, request: Request,
                                authorization: Optional[str] = Header(None)):
        """
        获取管理员信息接口
        GET /api/tucao/admin/info/get
        """
        token = self._get_token_from_header(request, authorization)
        return self.admin_business.get_current_admin(token)

    def ActionTucaoAdminChangePasswordPost(self, request: Request, body: AdminChangePasswordRequest,
                                           authorization: Optional[str] = Header(None)):
        """
        管理员修改密码接口
        POST /api/tucao/admin/change/password
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

    def ActionTucaoAdminDashboardGet(self, request: Request,
                                     authorization: Optional[str] = Header(None)):
        """
        获取仪表盘数据接口
        GET /api/tucao/admin/dashboard/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.get_dashboard_stats()

    def ActionTucaoAdminPostListGet(self, request: Request,
                                    page: int = Query(1, ge=1, description="页码"),
                                    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                    category: Optional[str] = Query(None, description="分类"),
                                    status: Optional[int] = Query(None, description="状态"),
                                    keyword: Optional[str] = Query(None, description="搜索关键词"),
                                    authorization: Optional[str] = Header(None)):
        """
        管理端获取吐槽列表接口
        GET /api/tucao/admin/post/list/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.get_admin_post_list(
            page=page,
            page_size=page_size,
            category=category,
            status=status,
            keyword=keyword
        )

    def ActionTucaoAdminPostDeletePost(self, request: Request,
                                       post_id: int = Query(..., description="吐槽ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        管理员删除吐槽接口
        POST /api/tucao/admin/post/delete
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.admin_delete_post(post_id)

    def ActionTucaoAdminPostRestorePost(self, request: Request,
                                        post_id: int = Query(..., description="吐槽ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        管理员恢复吐槽接口
        POST /api/tucao/admin/post/restore
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.admin_restore_post(post_id)

    def ActionTucaoAdminReportListGet(self, request: Request,
                                      page: int = Query(1, ge=1, description="页码"),
                                      page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                      status: Optional[int] = Query(None, description="状态"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取举报列表接口
        GET /api/tucao/admin/report/list/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.get_report_list(
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionTucaoAdminReportHandlePost(self, request: Request,
                                         report_id: int = Query(..., description="举报ID"),
                                         status: int = Query(..., description="处理状态"),
                                         authorization: Optional[str] = Header(None)):
        """
        处理举报接口
        POST /api/tucao/admin/report/handle
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.handle_report(report_id, status)

    def ActionTucaoAdminUserListGet(self, request: Request,
                                    page: int = Query(1, ge=1, description="页码"),
                                    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                    status: Optional[int] = Query(None, description="状态"),
                                    keyword: Optional[str] = Query(None, description="搜索关键词"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口
        GET /api/tucao/admin/user/list/get
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
            keyword=keyword
        )

    def ActionTucaoAdminUserBanPost(self, request: Request,
                                    user_id: int = Query(..., description="用户ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        封号用户接口
        POST /api/tucao/admin/user/ban
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.ban_user(user_id)

    def ActionTucaoAdminUserUnbanPost(self, request: Request,
                                      user_id: int = Query(..., description="用户ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        解封用户接口
        POST /api/tucao/admin/user/unban
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.unban_user(user_id)
