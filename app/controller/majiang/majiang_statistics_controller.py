from typing import Optional, Dict, Any
from fastapi import Request, Query, Header
from app.business.majiang import MajiangStatisticsBusiness
from app.business.majiang import MajiangUserBusiness, MajiangAdminBusiness


class MajiangStatisticsController:
    def __init__(self):
        self.statistics_business = MajiangStatisticsBusiness()
        self.user_business = MajiangUserBusiness()
        self.admin_business = MajiangAdminBusiness()

    def _verify_user(self, authorization: str) -> Optional[Dict[str, Any]]:
        if not authorization or not authorization.startswith('Bearer '):
            return None
        token = authorization.replace('Bearer ', '')
        result = self.user_business.verify_token(token)
        if result.get('code') == 0:
            return result.get('data')
        return None

    def _verify_admin(self, authorization: str) -> Optional[Dict[str, Any]]:
        if not authorization or not authorization.startswith('Bearer '):
            return None
        token = authorization.replace('Bearer ', '')
        result = self.admin_business.verify_admin_token(token)
        if result.get('code') == 0:
            return result.get('data')
        return None

    def ActionMajiangStatisticsOverallGet(self, request: Request):
        return self.statistics_business.get_overall_statistics()

    def ActionMajiangStatisticsUserGet(self, request: Request,
                                        authorization: Optional[str] = Header(None)):
        user = self._verify_user(authorization)
        if not user:
            return {
                'code': 1,
                'msg': '用户未登录',
                'data': None
            }

        return self.statistics_business.get_user_statistics(user.get('id'))

    def ActionMajiangStatisticsDailyGet(self, request: Request,
                                         days: int = Query(7, description='天数'),
                                         authorization: Optional[str] = Header(None)):
        admin = self._verify_admin(authorization)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员未登录或权限不足',
                'data': None
            }

        return self.statistics_business.get_daily_statistics(days)

    def ActionMajiangStatisticsDifficultyGet(self, request: Request,
                                              authorization: Optional[str] = Header(None)):
        admin = self._verify_admin(authorization)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员未登录或权限不足',
                'data': None
            }

        return self.statistics_business.get_difficulty_distribution()

    def ActionMajiangStatisticsTopPlayersGet(self, request: Request,
                                              limit: int = Query(10, description='数量')):
        return self.statistics_business.get_top_players_statistics(limit)

    def ActionMajiangStatisticsAiGet(self, request: Request,
                                      authorization: Optional[str] = Header(None)):
        admin = self._verify_admin(authorization)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员未登录或权限不足',
                'data': None
            }

        return self.statistics_business.get_ai_statistics()
