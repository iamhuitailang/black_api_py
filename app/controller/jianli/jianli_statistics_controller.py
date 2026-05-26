from typing import Optional
from fastapi import Request, Header, Query


class JianliStatisticsController:
    def __init__(self):
        from app.business.jianli.statistics_business import StatisticsBusiness
        from app.business.jianli.admin_business import AdminBusiness
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

    def ActionJianliStatisticsOverviewGet(self, request: Request,
                                           authorization: Optional[str] = Header(None)):
        """
        获取数据统计概览接口（管理员）
        GET /api/jianli/statistics/overview/get
        获取平台数据统计概览
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.statistics_business.get_overview()

    def ActionJianliStatisticsUserTrendGet(self, request: Request,
                                            days: int = Query(7, description="天数"),
                                            authorization: Optional[str] = Header(None)):
        """
        获取用户增长趋势接口（管理员）
        GET /api/jianli/statistics/user/trend/get
        获取用户增长趋势数据
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.statistics_business.get_user_trend(days)

    def ActionJianliStatisticsResumeTrendGet(self, request: Request,
                                              days: int = Query(7, description="天数"),
                                              authorization: Optional[str] = Header(None)):
        """
        获取简历增长趋势接口（管理员）
        GET /api/jianli/statistics/resume/trend/get
        获取简历增长趋势数据
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.statistics_business.get_resume_trend(days)

    def ActionJianliStatisticsTemplateGet(self, request: Request,
                                           authorization: Optional[str] = Header(None)):
        """
        获取模板使用统计接口（管理员）
        GET /api/jianli/statistics/template/get
        获取模板使用情况统计
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.statistics_business.get_template_statistics()

    def ActionJianliStatisticsCategoryGet(self, request: Request,
                                           authorization: Optional[str] = Header(None)):
        """
        获取分类统计接口（管理员）
        GET /api/jianli/statistics/category/get
        获取模板分类统计数据
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.statistics_business.get_category_statistics()
