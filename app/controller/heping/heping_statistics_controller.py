from typing import Optional
from fastapi import Request, Header, Query


class HepingStatisticsController:
    def __init__(self):
        from app.business.heping.statistics_business import StatisticsBusiness
        from app.business.heping.admin_business import HepingAdminBusiness
        self.statistics_business = StatisticsBusiness()
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

    def ActionHepingStatisticsOverviewGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }
        return self.statistics_business.get_overview()

    def ActionHepingStatisticsTrendGet(self, request: Request,
                                        days: int = Query(7, ge=1, le=365, description="天数"),
                                        authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }
        return self.statistics_business.get_trend(days=days)

    def ActionHepingStatisticsWeaponGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }
        return self.statistics_business.get_weapon_stats()

    def ActionHepingStatisticsMapGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }
        return self.statistics_business.get_map_stats()

    def ActionHepingStatisticsUserGrowthGet(self, request: Request,
                                             days: int = Query(7, ge=1, le=365, description="天数"),
                                             authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }
        return self.statistics_business.get_user_growth(days=days)
