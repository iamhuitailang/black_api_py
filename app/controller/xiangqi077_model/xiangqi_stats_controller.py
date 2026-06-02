from typing import Optional
from fastapi import Request, Header


class XiangqiStatsController:
    def __init__(self):
        from app.business.xiangqi077_model.stats_business import XiangqiStatsBusiness
        self.stats_business = XiangqiStatsBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        from app.business.xiangqi077_model.admin_business import XiangqiAdminBusiness
        return XiangqiAdminBusiness().verify_token(token)

    def ActionXiangqiStatsDashboardGet(self, request: Request,
                                        authorization: Optional[str] = Header(None)):
        """获取数据统计仪表盘"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.stats_business.get_dashboard_stats()

    def ActionXiangqiStatsRecentGamesGet(self, request: Request,
                                          authorization: Optional[str] = Header(None)):
        """获取最近对局"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.stats_business.get_recent_games()

    def ActionXiangqiStatsGameTypeGet(self, request: Request,
                                       authorization: Optional[str] = Header(None)):
        """获取对局类型统计"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.stats_business.get_game_type_stats()
