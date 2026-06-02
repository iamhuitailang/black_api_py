from typing import Optional
from fastapi import Request, Header, Query


class DafeijiDashboardController:
    def __init__(self):
        from app.business.dafeiji.dashboard_business import DafeijiDashboardBusiness
        from app.business.dafeiji.user_business import DafeijiUserBusiness
        self.dashboard_business = DafeijiDashboardBusiness()
        self.user_business = DafeijiUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionDafeijiDashboardOverviewGet(self, request: Request,
                                           authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.dashboard_business.get_overview()

    def ActionDafeijiDashboardDailyStatsGet(self, request: Request,
                                             days: int = Query(7, ge=1, le=30, description="天数"),
                                             authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.dashboard_business.get_daily_stats(days=days)

    def ActionDafeijiDashboardPopularAircraftGet(self, request: Request,
                                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.dashboard_business.get_popular_aircraft()

    def ActionDafeijiDashboardTopPlayersGet(self, request: Request,
                                             limit: int = Query(10, ge=1, le=100, description="数量"),
                                             authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.dashboard_business.get_top_players(limit=limit)
