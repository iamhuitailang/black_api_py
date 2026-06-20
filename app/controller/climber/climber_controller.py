from typing import Optional, Dict
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field
from app.business.climber import ClimberBusiness


class ClimberRecordRequest(BaseModel):
    player_name: str = Field(default='匿名勇士', max_length=20)
    total_time: float = Field(..., gt=0)
    fall_count: int = Field(default=0, ge=0)
    floor_times: Optional[Dict[str, float]] = None


class ClimberController:
    def __init__(self):
        self.business = ClimberBusiness()

    def ActionClimberRecordPost(self, request: Request, body: ClimberRecordRequest):
        """
        提交通关记录
        POST /api/climber/record
        """
        return self.business.submit_record(
            player_name=body.player_name,
            total_time=body.total_time,
            fall_count=body.fall_count,
            floor_times=body.floor_times
        )

    def ActionClimberRecords(self, request: Request, limit: int = Query(50, ge=1, le=200)):
        """
        获取通关排行榜（按用时升序）
        GET /api/climber/records
        """
        return self.business.get_records(limit=limit)

    def ActionClimberFloorStats(self, request: Request):
        """
        获取每层通关统计（通关次数/平均用时/最佳用时）
        GET /api/climber/floor/stats
        """
        return self.business.get_floor_stats()

    def ActionClimberSummary(self, request: Request):
        """
        获取游戏总览统计
        GET /api/climber/summary
        """
        return self.business.get_summary()
