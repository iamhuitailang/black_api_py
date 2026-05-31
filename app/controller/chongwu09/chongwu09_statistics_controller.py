from typing import Optional
from fastapi import Request, Header


class Chongwu09StatisticsController:
    def __init__(self):
        from app.business.chongwu09.statistics_business import StatisticsBusiness
        from app.business.chongwu09.admin_business import AdminBusiness
        self.statistics_business = StatisticsBusiness()
        self.admin_business = AdminBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionChongwu09StatisticsDashboardGet(self, request: Request,
                                               authorization: Optional[str] = Header(None)):
        """
        获取仪表盘统计数据
        GET /api/chongwu09/statistics/dashboard/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.statistics_business.get_dashboard()
