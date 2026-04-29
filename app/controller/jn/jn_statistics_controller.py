from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class JnStatisticsController:
    def __init__(self):
        from app.business.jn.statistics_business import JnStatisticsBusiness
        from app.business.jn.admin_business import JnAdminBusiness
        from app.business.jn.user_business import JnUserBusiness
        self.statistics_business = JnStatisticsBusiness()
        self.admin_business = JnAdminBusiness()
        self.user_business = JnUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionJnStatisticsDashboardGet(self, request: Request,
                                        authorization: Optional[str] = Header(None)):
        """
        获取仪表盘统计接口
        GET /api/jn/statistics/dashboard/get
        获取管理端仪表盘统计数据
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.statistics_business.get_dashboard_stats()

    def ActionJnStatisticsHotSkillsGet(self, request: Request,
                                         limit: int = Query(10, description="返回数量"),
                                         authorization: Optional[str] = Header(None)):
        """
        获取热门技能接口
        GET /api/jn/statistics/hot/skills/get
        获取热门技能排名
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        result = self.statistics_business.get_hot_skills(limit)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def ActionJnStatisticsCategoryGet(self, request: Request,
                                        authorization: Optional[str] = Header(None)):
        """
        获取分类统计接口
        GET /api/jn/statistics/category/get
        获取各分类技能数量统计
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        result = self.statistics_business.get_category_stats()
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def ActionJnStatisticsExchangeGet(self, request: Request,
                                        authorization: Optional[str] = Header(None)):
        """
        获取交换统计接口
        GET /api/jn/statistics/exchange/get
        获取交换状态统计
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.statistics_business.get_exchange_statistics()

    def ActionJnStatisticsUserGet(self, request: Request,
                                    user_id: int = Query(..., description="用户ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取用户统计接口
        GET /api/jn/statistics/user/get
        获取指定用户的统计数据
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        user = self._get_current_user(token)

        if not admin and not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user and user.get('id') != user_id:
            return {
                'code': 1,
                'msg': '无权查看他人统计',
                'data': None
            }

        return self.statistics_business.get_user_statistics(user_id)
