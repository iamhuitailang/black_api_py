from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class ResetPasswordRequest(BaseModel):
    new_password: str = Field(..., description="新密码")


class HuangjinAdminController:
    def __init__(self):
        from app.business.huangjin_model.admin_business import HuangjinAdminBusiness
        from app.business.huangjin_model.stats_business import StatsBusiness
        self.admin_business = HuangjinAdminBusiness()
        self.stats_business = StatsBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        from app.business.huangjin_model.auth_business import HuangjinAuthBusiness
        user = HuangjinAuthBusiness().verify_token(token)
        if user and user.get('role') == 1:
            return user
        return None

    def ActionHuangjinAdminLoginPost(self, request: Request, body: AdminLoginRequest):
        """
        管理员登录接口
        POST /api/huangjin/admin/login
        管理员账号密码登录
        """
        return self.admin_business.admin_login(
            username=body.username,
            password=body.password
        )

    def ActionHuangjinAdminDashboardGet(self, request: Request,
                                         authorization: Optional[str] = Header(None)):
        """
        管理员仪表盘接口
        GET /api/huangjin/admin/dashboard/get
        获取统计数据概览
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先以管理员身份登录',
                'data': None
            }
        return self.stats_business.get_dashboard_stats()

    def ActionHuangjinAdminUserListGet(self, request: Request,
                                        page: int = Query(1, ge=1, description="页码"),
                                        page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                        status: Optional[int] = Query(None, description="用户状态"),
                                        role: Optional[int] = Query(None, description="用户角色"),
                                        keyword: Optional[str] = Query(None, description="搜索关键词"),
                                        authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口
        GET /api/huangjin/admin/user/list/get
        管理员获取用户列表
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先以管理员身份登录',
                'data': None
            }
        return self.admin_business.get_user_list(page, page_size, status, role, keyword)

    def ActionHuangjinAdminUserBanPost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        封禁用户接口
        POST /api/huangjin/admin/user/ban
        管理员封禁用户
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先以管理员身份登录',
                'data': None
            }
        return self.admin_business.ban_user(user_id)

    def ActionHuangjinAdminUserUnbanPost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        解封用户接口
        POST /api/huangjin/admin/user/unban
        管理员解封用户
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先以管理员身份登录',
                'data': None
            }
        return self.admin_business.unban_user(user_id)

    def ActionHuangjinAdminUserDeletePost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                           authorization: Optional[str] = Header(None)):
        """
        删除用户接口
        POST /api/huangjin/admin/user/delete
        管理员删除用户
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先以管理员身份登录',
                'data': None
            }
        return self.admin_business.delete_user(user_id)

    def ActionHuangjinAdminUserResetPasswordPost(self, request: Request, body: ResetPasswordRequest,
                                                   user_id: int = Query(..., description="用户ID"),
                                                   authorization: Optional[str] = Header(None)):
        """
        重置用户密码接口
        POST /api/huangjin/admin/user/reset/password
        管理员重置用户密码
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先以管理员身份登录',
                'data': None
            }
        return self.admin_business.reset_user_password(user_id, body.new_password)

    def ActionHuangjinAdminUserSetRolePost(self, request: Request,
                                            user_id: int = Query(..., description="用户ID"),
                                            role: int = Query(..., description="角色"),
                                            authorization: Optional[str] = Header(None)):
        """
        设置用户角色接口
        POST /api/huangjin/admin/user/set/role
        管理员设置用户角色
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先以管理员身份登录',
                'data': None
            }
        return self.admin_business.set_admin_role(user_id, role)

    def ActionHuangjinAdminStatsScoreGet(self, request: Request,
                                          authorization: Optional[str] = Header(None)):
        """
        获取分数统计接口
        GET /api/huangjin/admin/stats/score/get
        管理员获取分数分布统计
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先以管理员身份登录',
                'data': None
            }
        return self.stats_business.get_score_distribution()

    def ActionHuangjinAdminStatsOreGet(self, request: Request,
                                        authorization: Optional[str] = Header(None)):
        """
        获取矿石统计接口
        GET /api/huangjin/admin/stats/ore/get
        管理员获取矿石统计
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先以管理员身份登录',
                'data': None
            }
        return self.stats_business.get_ore_stats()

    def ActionHuangjinAdminStatsAchievementGet(self, request: Request,
                                                authorization: Optional[str] = Header(None)):
        """
        获取成就统计接口
        GET /api/huangjin/admin/stats/achievement/get
        管理员获取成就统计
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先以管理员身份登录',
                'data': None
            }
        return self.stats_business.get_achievement_stats()
