from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class JieyongStatisticsController:
    def __init__(self):
        from app.business.jieyong_model.statistics_business import JieyongStatisticsBusiness
        from app.business.jieyong_model.auth_business import JieyongAuthBusiness
        self.statistics_business = JieyongStatisticsBusiness()
        self.auth_business = JieyongAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def _require_admin(self, token: str) -> Optional[dict]:
        user = self._get_current_user(token)
        if not user:
            return None
        if not self.auth_business.is_admin(user.get('id')):
            return None
        return user

    def ActionJieyongStatisticsDashboardGet(self, request: Request,
                                         authorization: Optional[str] = Header(None)):
        """
        获取仪表盘统计数据接口（管理员）
        GET /api/jieyong_model/statistics/dashboard/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)
        if not admin:
            return {'code': 1, 'msg': '无权限访问', 'data': None}

        return self.statistics_business.get_dashboard_stats()

    def ActionJieyongStatisticsTrendGet(self, request: Request,
                                   days: int = Query(30, description="天数"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取借用趋势数据接口（管理员）
        GET /api/jieyong_model/statistics/trend/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)
        if not admin:
            return {'code': 1, 'msg': '无权限访问', 'data': None}

        return self.statistics_business.get_borrow_trend(days=days)

    def ActionJieyongStatisticsCategoryGet(self, request: Request,
                                         authorization: Optional[str] = Header(None)):
        """
        获取分类分布统计接口（管理员）
        GET /api/jieyong_model/statistics/category/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)
        if not admin:
            return {'code': 1, 'msg': '无权限访问', 'data': None}

        return self.statistics_business.get_category_distribution()

    def ActionJieyongStatisticsHotItemsGet(self, request: Request,
                                     limit: int = Query(10, description="数量"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取热门物品统计接口（管理员）
        GET /api/jieyong_model/statistics/hot/items/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)
        if not admin:
            return {'code': 1, 'msg': '无权限访问', 'data': None}

        return self.statistics_business.get_hot_items(limit=limit)

    def ActionJieyongStatisticsActiveUsersGet(self, request: Request,
                                       limit: int = Query(10, description="数量"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取活跃用户统计接口（管理员）
        GET /api/jieyong_model/statistics/active/users/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)
        if not admin:
            return {'code': 1, 'msg': '无权限访问', 'data': None}

        return self.statistics_business.get_active_users(limit=limit)

    def ActionJieyongStatisticsOverdueGet(self, request: Request,
                                    authorization: Optional[str] = Header(None)):
        """
        获取逾期统计接口（管理员）
        GET /api/jieyong_model/statistics/overdue/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)
        if not admin:
            return {'code': 1, 'msg': '无权限访问', 'data': None}

        return self.statistics_business.get_overdue_stats()

    def ActionJieyongStatisticsExportGet(self, request: Request,
                                     status: Optional[int] = Query(None, description="状态"),
                                     start_date: Optional[str] = Query(None, description="开始日期"),
                                     end_date: Optional[str] = Query(None, description="结束日期"),
                                     authorization: Optional[str] = Header(None)):
        """
        导出借用记录接口（管理员）
        GET /api/jieyong_model/statistics/export/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)
        if not admin:
            return {'code': 1, 'msg': '无权限访问', 'data': None}

        return self.statistics_business.export_records(
            status=status,
            start_date=start_date,
            end_date=end_date
        )
