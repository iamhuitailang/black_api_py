from typing import Optional
from fastapi import Request, Header, Query


class DanzhuStatisticsController:
    def __init__(self):
        from app.business.danzhu import DanzhuStatisticsBusiness
        self.statistics_business = DanzhuStatisticsBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str):
        from app.business.danzhu import DanzhuAuthBusiness
        auth_business = DanzhuAuthBusiness()
        return auth_business.verify_admin_token(token)

    def ActionDanzhuStatisticsOverviewGet(self, request: Request,
                                            authorization: Optional[str] = Header(None)):
        """
        获取总览统计接口
        GET /api/danzhu/statistics/overview/get
        管理员获取系统总览统计数据
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.statistics_business.get_overview_statistics()

    def ActionDanzhuStatisticsGameGet(self, request: Request,
                                       level_id: Optional[int] = Query(None, description="关卡ID"),
                                       start_date: Optional[str] = Query(None, description="开始日期"),
                                       end_date: Optional[str] = Query(None, description="结束日期"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取游戏统计接口
        GET /api/danzhu/statistics/game/get
        管理员获取游戏统计数据
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.statistics_business.get_game_statistics(level_id, start_date, end_date)

    def ActionDanzhuStatisticsDailyGet(self, request: Request,
                                        days: int = Query(7, description="天数"),
                                        authorization: Optional[str] = Header(None)):
        """
        获取每日趋势接口
        GET /api/danzhu/statistics/daily/get
        管理员获取每日游戏趋势数据
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.statistics_business.get_daily_trend(days)

    def ActionDanzhuStatisticsUserGrowthGet(self, request: Request,
                                             days: int = Query(7, description="天数"),
                                             authorization: Optional[str] = Header(None)):
        """
        获取用户增长接口
        GET /api/danzhu/statistics/user/growth/get
        管理员获取用户增长数据
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.statistics_business.get_user_growth(days)

    def ActionDanzhuStatisticsAchievementGet(self, request: Request,
                                              authorization: Optional[str] = Header(None)):
        """
        获取成就统计接口
        GET /api/danzhu/statistics/achievement/get
        管理员获取成就统计数据
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.statistics_business.get_achievement_statistics()

    def ActionDanzhuStatisticsLevelGet(self, request: Request,
                                        authorization: Optional[str] = Header(None)):
        """
        获取关卡统计接口
        GET /api/danzhu/statistics/level/get
        管理员获取关卡统计数据
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.statistics_business.get_level_statistics()

    def ActionDanzhuStatisticsTopPlayersGet(self, request: Request,
                                             limit: int = Query(10, description="数量"),
                                             authorization: Optional[str] = Header(None)):
        """
        获取顶尖玩家接口
        GET /api/danzhu/statistics/top/players/get
        管理员获取顶尖玩家数据
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.statistics_business.get_top_players(limit)
