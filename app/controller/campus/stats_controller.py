from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.campus import SummaryBusiness, StatsBusiness


class SummarySubmitRequest(BaseModel):
    activity_id: int
    actual_count: int
    satisfaction_score: Optional[float] = 0.0
    photos: Optional[str] = ''
    summary: Optional[str] = ''


class StatsController:
    def __init__(self):
        self.summary_biz = SummaryBusiness()
        self.stats_biz = StatsBusiness()

    def ActionCampusSummarySet(self, request: Request, body: SummarySubmitRequest):
        """
        提交活动总结
        POST /api/campus/summary/set
        """
        return self.summary_biz.submit(
            body.activity_id, body.actual_count,
            body.satisfaction_score, body.photos, body.summary
        )

    def ActionCampusSummaryGet(self, request: Request, activity_id: int = Query(..., ge=1)):
        """
        获取活动总结
        GET /api/campus/summary/get
        """
        return self.summary_biz.get_by_activity(activity_id)

    def ActionCampusSummaryBancheck(self, request: Request):
        """
        检查并封禁超时未提交总结的主办方
        GET /api/campus/summary/bancheck
        """
        return self.summary_biz.check_overdue_and_ban()

    def ActionCampusStatsOverview(self, request: Request, semester: Optional[str] = Query(None)):
        """
        获取统计概览
        GET /api/campus/stats/overview
        """
        return self.stats_biz.overview(semester)

    def ActionCampusStatsBytype(self, request: Request, semester: Optional[str] = Query(None)):
        """
        按类型统计
        GET /api/campus/stats/bytype
        """
        return self.stats_biz.by_type(semester)

    def ActionCampusStatsBydepartment(self, request: Request, semester: Optional[str] = Query(None)):
        """
        按院系统计
        GET /api/campus/stats/bydepartment
        """
        return self.stats_biz.by_department(semester)

    def ActionCampusStatsBysemester(self, request: Request):
        """
        按学期统计
        GET /api/campus/stats/bysemester
        """
        return self.stats_biz.by_semester()
