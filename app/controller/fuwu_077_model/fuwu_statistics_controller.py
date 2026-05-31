from typing import Optional
from fastapi import Request, Header, Query


class FuwuStatisticsController:
    def __init__(self):
        from app.business.fuwu_077_model.statistics_business import StatisticsBusiness
        from app.business.fuwu_077_model.admin_auth_business import AdminAuthBusiness
        self.statistics_business = StatisticsBusiness()
        self.admin_auth_business = AdminAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_auth_business.verify_token(token)

    def ActionFuwu077ModelStatisticsOverviewGet(self, request: Request,
                                         start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
                                         end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
                                         authorization: Optional[str] = Header(None)):
        """
        获取统计概览接口
        GET /api/fuwu_077_model/statistics/overview/get
        获取订单、用户、服务人员等统计概览数据
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.statistics_business.get_overview(start_date, end_date)

    def ActionFuwu077ModelStatisticsDailyGet(self, request: Request,
                                      start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
                                      end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取每日统计接口
        GET /api/fuwu_077_model/statistics/daily/get
        获取每日订单数量和金额统计
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.statistics_business.get_daily_stats(start_date, end_date)

    def ActionFuwu077ModelStatisticsServiceGet(self, request: Request,
                                        start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
                                        end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
                                        authorization: Optional[str] = Header(None)):
        """
        获取服务统计接口
        GET /api/fuwu_077_model/statistics/service/get
        获取各服务类型的订单统计
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.statistics_business.get_service_stats(start_date, end_date)

    def ActionFuwu077ModelStatisticsFullGet(self, request: Request,
                                     start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
                                     end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取完整统计接口
        GET /api/fuwu_077_model/statistics/full/get
        获取完整的统计数据，包括概览、每日统计、服务统计、即将到来的订单、热门服务人员
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.statistics_business.get_full_statistics(start_date, end_date)
