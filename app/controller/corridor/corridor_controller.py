from typing import Optional, List
from fastapi import Query, Request
from pydantic import BaseModel, Field
from app.business.corridor import LeaderboardBusiness


class ScoreSubmitRequest(BaseModel):
    player_name: str = Field(..., description="玩家名称")
    total_time: float = Field(..., gt=0, description="总用时（秒）")
    segment_times: List[float] = Field(..., description="每段用时（秒）列表")
    weapon_preference: str = Field(default='', description="武器使用偏好")
    final_hp: int = Field(default=0, ge=0, description="通关剩余血量")


class CorridorController:
    def __init__(self):
        self.business = LeaderboardBusiness()

    def ActionCorridorLeaderboardGet(self, request: Request,
                                      limit: int = Query(20, ge=1, le=100, description="返回数量")):
        """获取排行榜
        GET /api/corridor/leaderboard/get
        """
        return self.business.get_leaderboard(limit)

    def ActionCorridorLeaderboardPaginatedGet(self, request: Request,
                                                page: int = Query(1, ge=1),
                                                page_size: int = Query(10, ge=1, le=100)):
        """获取排行榜（分页）
        GET /api/corridor/leaderboard/paginated/get
        """
        return self.business.get_leaderboard_paginated(page, page_size)

    def ActionCorridorScoreSet(self, request: Request, body: ScoreSubmitRequest):
        """提交游戏分数
        POST /api/corridor/score/set
        """
        return self.business.submit_score(
            player_name=body.player_name,
            total_time=body.total_time,
            segment_times=body.segment_times,
            weapon_preference=body.weapon_preference,
            final_hp=body.final_hp
        )
