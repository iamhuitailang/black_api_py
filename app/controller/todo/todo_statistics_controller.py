from typing import Optional
from fastapi import Request, Header, Query


class TodoStatisticsController:
    def __init__(self):
        from app.business.todo.todo_statistics_business import TodoStatisticsBusiness
        from app.business.todo.todo_auth_business import TodoAuthBusiness
        self.statistics_business = TodoStatisticsBusiness()
        self.auth_business = TodoAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def ActionTodoStatisticsOverviewGet(self, request: Request,
                                         start_date: Optional[str] = Query(None, description="开始日期"),
                                         end_date: Optional[str] = Query(None, description="结束日期"),
                                         authorization: Optional[str] = Header(None)):
        """
        获取统计概览接口
        GET /api/todo/statistics/overview/get
        获取任务统计概览数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.statistics_business.get_overview(
            user_id=user.get('id'),
            start_date=start_date,
            end_date=end_date
        )

    def ActionTodoStatisticsTrendGet(self, request: Request,
                                      days: int = Query(30, description="统计天数"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取趋势数据接口
        GET /api/todo/statistics/trend/get
        获取任务完成趋势数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.statistics_business.get_trend(user.get('id'), days)

    def ActionTodoStatisticsTagDistributionGet(self, request: Request,
                                                authorization: Optional[str] = Header(None)):
        """
        获取标签分布接口
        GET /api/todo/statistics/tag/distribution/get
        获取任务按标签分布的数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.statistics_business.get_tag_distribution(user.get('id'))

    def ActionTodoStatisticsProjectDistributionGet(self, request: Request,
                                                    authorization: Optional[str] = Header(None)):
        """
        获取项目分布接口
        GET /api/todo/statistics/project/distribution/get
        获取任务按项目分布的数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.statistics_business.get_project_distribution(user.get('id'))

    def ActionTodoStatisticsCalendarGet(self, request: Request,
                                         year: int = Query(..., description="年份"),
                                         month: int = Query(..., description="月份"),
                                         authorization: Optional[str] = Header(None)):
        """
        获取日历数据接口
        GET /api/todo/statistics/calendar/get
        获取指定年月的任务日历数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.statistics_business.get_calendar_data(user.get('id'), year, month)

    def ActionTodoStatisticsKanbanGet(self, request: Request,
                                       project_id: Optional[int] = Query(None, description="项目ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取看板数据接口
        GET /api/todo/statistics/kanban/get
        获取看板视图数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.statistics_business.get_kanban_data(user.get('id'), project_id)

    def ActionTodoStatisticsPersonalGet(self, request: Request,
                                         authorization: Optional[str] = Header(None)):
        """
        获取个人统计接口
        GET /api/todo/statistics/personal/get
        获取个人任务统计数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.statistics_business.get_personal_stats(user.get('id'))
