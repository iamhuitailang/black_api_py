from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class BaoxiuStatisticsController:
    def __init__(self):
        from app.business.baoxiu.statistics_business import BaoxiuStatisticsBusiness
        from app.business.baoxiu.auth_business import BaoxiuAuthBusiness
        self.statistics_business = BaoxiuStatisticsBusiness()
        self.auth_business = BaoxiuAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def ActionBaoxiuStatisticsDashboardGet(self, request: Request,
                                            authorization: Optional[str] = Header(None)):
        """
        获取仪表盘统计数据接口
        GET /api/baoxiu/statistics/dashboard/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        user_id = user.get('id') if user else None
        role = user.get('role') if user else None
        
        return self.statistics_business.get_dashboard_stats(user_id=user_id, role=role)

    def ActionBaoxiuStatisticsOrderGet(self, request: Request,
                                        start_date: Optional[str] = Query(None, description="开始日期"),
                                        end_date: Optional[str] = Query(None, description="结束日期"),
                                        authorization: Optional[str] = Header(None)):
        """
        获取报修统计数据接口
        GET /api/baoxiu/statistics/order/get
        """
        return self.statistics_business.get_order_statistics(start_date, end_date)
