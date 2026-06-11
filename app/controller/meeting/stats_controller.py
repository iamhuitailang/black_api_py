from fastapi import Request
from app.business.meeting import ActionItemBusiness


class StatsController:
    def __init__(self):
        self.business = ActionItemBusiness()

    def ActionStatsProject(self, request: Request):
        """
        获取按项目统计数据
        GET /api/stats/project
        """
        result = self.business.get_project_stats()
        return result
