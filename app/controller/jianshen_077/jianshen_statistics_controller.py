from typing import Optional
from fastapi import Request, Header, Query


class JianshenStatisticsController:
    def __init__(self):
        from app.business.jianshen_077.statistics_business import StatisticsBusiness
        self.statistics_business = StatisticsBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.jianshen_077.auth_business import JianshenAuthBusiness
        return JianshenAuthBusiness().verify_token(token)

    def ActionJianshenStatisticsDashboardGet(self, request: Request,
                                              authorization: Optional[str] = Header(None)):
        """
        获取数据概览接口
        GET /api/jianshen/statistics/dashboard/get
        管理员获取数据概览
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        return self.statistics_business.get_dashboard()

    def ActionJianshenStatisticsCourseGet(self, request: Request,
                                           authorization: Optional[str] = Header(None)):
        """
        获取课程统计接口
        GET /api/jianshen/statistics/course/get
        管理员获取课程统计数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        return self.statistics_business.get_course_statistics()

    def ActionJianshenStatisticsMemberGet(self, request: Request,
                                           authorization: Optional[str] = Header(None)):
        """
        获取会员统计接口
        GET /api/jianshen/statistics/member/get
        管理员获取会员统计数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        return self.statistics_business.get_member_statistics()
