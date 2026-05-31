from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AdminUserIdRequest(BaseModel):
    user_id: int = Field(..., description="用户ID")


class ZbtAdminController:
    def __init__(self):
        from app.business.zhaobutong.user_business import ZbtUserBusiness
        from app.business.zhaobutong.level_business import ZbtLevelBusiness
        from app.business.zhaobutong.game_business import ZbtGameBusiness
        self.user_business = ZbtUserBusiness()
        self.level_business = ZbtLevelBusiness()
        self.game_business = ZbtGameBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def _is_admin(self, token: str) -> bool:
        user = self._get_current_user(token)
        return user is not None and user.get('role') == 1

    def ActionZbtAdminUserListGet(self, request: Request,
                                   page: int = Query(1, ge=1, description="页码"),
                                   page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                   status: Optional[int] = Query(None, description="状态"),
                                   role: Optional[int] = Query(None, description="角色"),
                                   keyword: Optional[str] = Query(None, description="搜索关键词"),
                                   authorization: Optional[str] = Header(None)):
        """
        管理员获取用户列表接口
        GET /api/zbt/admin/user/list/get
        管理员获取所有用户列表
        """
        token = self._get_token_from_header(request, authorization)
        if not self._is_admin(token):
            return {'code': 1, 'msg': '需要管理员权限', 'data': None}
        return self.user_business.get_user_list(page, page_size, status, role, keyword)

    def ActionZbtAdminUserBanPost(self, request: Request, body: AdminUserIdRequest,
                                   authorization: Optional[str] = Header(None)):
        """
        封号用户接口
        POST /api/zbt/admin/user/ban
        管理员封号用户
        """
        token = self._get_token_from_header(request, authorization)
        if not self._is_admin(token):
            return {'code': 1, 'msg': '需要管理员权限', 'data': None}
        return self.user_business.ban_user(body.user_id)

    def ActionZbtAdminUserUnbanPost(self, request: Request, body: AdminUserIdRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        解封用户接口
        POST /api/zbt/admin/user/unban
        管理员解封用户
        """
        token = self._get_token_from_header(request, authorization)
        if not self._is_admin(token):
            return {'code': 1, 'msg': '需要管理员权限', 'data': None}
        return self.user_business.unban_user(body.user_id)

    def ActionZbtAdminUserDeletePost(self, request: Request, body: AdminUserIdRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        删除用户接口
        POST /api/zbt/admin/user/delete
        管理员删除用户
        """
        token = self._get_token_from_header(request, authorization)
        if not self._is_admin(token):
            return {'code': 1, 'msg': '需要管理员权限', 'data': None}
        return self.user_business.delete_user(body.user_id)

    def ActionZbtAdminStatsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取统计数据接口
        GET /api/zbt/admin/stats/get
        管理员获取游戏统计数据
        """
        token = self._get_token_from_header(request, authorization)
        if not self._is_admin(token):
            return {'code': 1, 'msg': '需要管理员权限', 'data': None}
        return self.game_business.get_stats()

    def ActionZbtAdminRecentGamesGet(self, request: Request,
                                      limit: int = Query(20, ge=1, le=100, description="返回数量"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取最近游戏记录接口
        GET /api/zbt/admin/recent/games/get
        管理员获取最近游戏记录
        """
        token = self._get_token_from_header(request, authorization)
        if not self._is_admin(token):
            return {'code': 1, 'msg': '需要管理员权限', 'data': None}
        return self.game_business.get_recent_records(limit)
