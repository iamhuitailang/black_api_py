from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class JiudianAdminController:
    def __init__(self):
        from app.business.jiudian_077.user_business import JiudianUserBusiness
        from app.business.jiudian_077.statistics_business import JiudianStatisticsBusiness
        self.user_business = JiudianUserBusiness()
        self.statistics_business = JiudianStatisticsBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def _is_admin(self, user: dict) -> bool:
        return user and user.get('role') == 'admin'

    def ActionJiudian077AdminDashboardGet(self, request: Request,
                                           authorization: Optional[str] = Header(None)):
        """
        获取仪表盘统计数据接口
        GET /api/jiudian_077/admin/dashboard/get
        管理员获取仪表盘统计数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not self._is_admin(user):
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.statistics_business.get_dashboard_stats()

    def ActionJiudian077AdminBookingStatsGet(self, request: Request,
                                              start_date: Optional[str] = Query(None, description="开始日期"),
                                              end_date: Optional[str] = Query(None, description="结束日期"),
                                              authorization: Optional[str] = Header(None)):
        """
        获取预订统计数据接口
        GET /api/jiudian_077/admin/booking/stats/get
        管理员获取预订统计数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not self._is_admin(user):
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.statistics_business.get_booking_statistics(
            start_date=start_date,
            end_date=end_date
        )

    def ActionJiudian077AdminRoomStatsGet(self, request: Request,
                                           authorization: Optional[str] = Header(None)):
        """
        获取房间统计数据接口
        GET /api/jiudian_077/admin/room/stats/get
        管理员获取房间统计数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not self._is_admin(user):
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.statistics_business.get_room_statistics()

    def ActionJiudian077AdminUserStatsGet(self, request: Request,
                                           authorization: Optional[str] = Header(None)):
        """
        获取用户统计数据接口
        GET /api/jiudian_077/admin/user/stats/get
        管理员获取用户统计数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not self._is_admin(user):
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.statistics_business.get_user_statistics()

    def ActionJiudian077AdminUserListGet(self, request: Request,
                                          page: int = Query(1, description="页码"),
                                          page_size: int = Query(10, description="每页数量"),
                                          role: Optional[str] = Query(None, description="角色"),
                                          status: Optional[int] = Query(None, description="状态"),
                                          keyword: Optional[str] = Query(None, description="关键词"),
                                          authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口
        GET /api/jiudian_077/admin/user/list/get
        管理员获取用户列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not self._is_admin(user):
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.user_business.get_user_list(
            page=page,
            page_size=page_size,
            role=role,
            status=status,
            keyword=keyword
        )

    def ActionJiudian077AdminUserStatusUpdatePost(self, request: Request,
                                                   user_id: int = Query(..., description="用户ID"),
                                                   status: int = Query(..., description="状态"),
                                                   authorization: Optional[str] = Header(None)):
        """
        更新用户状态接口
        POST /api/jiudian_077/admin/user/status/update
        管理员更新用户状态（启用/禁用）
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not self._is_admin(user):
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.user_business.update_user_status(
            user_id=user_id,
            status=status
        )
