from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class LogWorkHourRequest(BaseModel):
    task_id: int = Field(..., description="任务ID")
    hours: float = Field(..., description="工时")
    date: str = Field(..., description="工作日期")
    description: Optional[str] = Field(None, description="工作描述")


class XzStatisticsController:
    def __init__(self):
        from app.business.xiaozu.statistics_business import XzStatisticsBusiness
        self.stats_business = XzStatisticsBusiness()

    def _get_token(self, request: Request, authorization: Optional[str]) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token or ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.xiaozu.auth_business import XzAuthBusiness
        auth = XzAuthBusiness()
        return auth.verify_token(token)

    def ActionXzStatsDashboardGet(self, request: Request, team_id: int = Query(..., description="小组ID"),
                                   authorization: Optional[str] = Header(None)):
        """获取仪表盘数据"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.stats_business.get_dashboard(team_id, user['id'])

    def ActionXzStatsWorkloadGet(self, request: Request, team_id: int = Query(..., description="小组ID"),
                                  authorization: Optional[str] = Header(None)):
        """获取成员工作量统计"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.stats_business.get_workload_stats(team_id, user['id'])

    def ActionXzStatsTrendGet(self, request: Request, team_id: int = Query(..., description="小组ID"),
                               days: int = Query(7, description="天数"),
                               authorization: Optional[str] = Header(None)):
        """获取完成趋势"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.stats_business.get_completion_trend(team_id, user['id'], days)

    def ActionXzStatsPriorityGet(self, request: Request, team_id: int = Query(..., description="小组ID"),
                                  authorization: Optional[str] = Header(None)):
        """获取优先级分布"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.stats_business.get_priority_distribution(team_id, user['id'])

    def ActionXzStatsBurndownGet(self, request: Request, team_id: int = Query(..., description="小组ID"),
                                  authorization: Optional[str] = Header(None)):
        """获取燃尽图数据"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.stats_business.get_burndown(team_id, user['id'])

    def ActionXzStatsExportGet(self, request: Request, team_id: int = Query(..., description="小组ID"),
                                authorization: Optional[str] = Header(None)):
        """导出CSV"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.stats_business.export_csv(team_id, user['id'])

    def ActionXzStatsNotificationListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """获取通知列表"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.stats_business.get_notifications(user['id'])

    def ActionXzStatsNotificationReadPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """标记通知为已读"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        notification_id = int(request.query_params.get('notification_id', 0))
        return self.stats_business.mark_notification_read(user['id'], notification_id)

    def ActionXzStatsNotificationReadAllPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """标记所有通知为已读"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.stats_business.mark_all_notifications_read(user['id'])

    def ActionXzStatsWorkhourLogPost(self, request: Request, body: LogWorkHourRequest,
                                      authorization: Optional[str] = Header(None)):
        """登记工时"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.stats_business.log_work_hour(
            body.task_id, user['id'], body.hours, body.date, body.description
        )

    def ActionXzStatsWorkhourListGet(self, request: Request, task_id: int = Query(..., description="任务ID"),
                                      authorization: Optional[str] = Header(None)):
        """获取工时记录"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.stats_business.get_work_hours(task_id, user['id'])
