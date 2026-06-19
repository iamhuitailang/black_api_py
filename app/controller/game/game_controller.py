from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.game import GameBusiness


class GameRecordSubmitRequest(BaseModel):
    player_name: str
    clear_time: float
    specimen_count: int = 0
    area_cleared: int = 0


class GameController:
    def __init__(self):
        self.business = GameBusiness()

    def ActionGameSubmitPost(self, request: Request, body: GameRecordSubmitRequest):
        """
        提交游戏通关记录
        POST /api/game/submit
        """
        result = self.business.submit_record(
            player_name=body.player_name,
            clear_time=body.clear_time,
            specimen_count=body.specimen_count,
            area_cleared=body.area_cleared
        )
        return result

    def ActionGameLeaderboardTime(self, request: Request, limit: int = Query(10, ge=1, le=100)):
        """
        获取通关时间排行榜
        GET /api/game/leaderboard/time
        """
        result = self.business.get_leaderboard_time(limit=limit)
        return result

    def ActionGameLeaderboardSpecimens(self, request: Request, limit: int = Query(10, ge=1, le=100)):
        """
        获取标本收集排行榜
        GET /api/game/leaderboard/specimens
        """
        result = self.business.get_leaderboard_specimens(limit=limit)
        return result

    def ActionGameRecordlist(self, request: Request, page: int = Query(1, ge=1),
                                 page_size: int = Query(10, ge=1, le=100)):
        """
        获取所有记录列表（分页）
        GET /api/game/record/list
        """
        result = self.business.get_all_records(page=page, page_size=page_size)
        return result

    def ActionGameRecordGet(self, request: Request, id: int = Query(..., ge=1)):
        """
        获取单条记录详情
        GET /api/game/record/get
        """
        result = self.business.get_record(record_id=id)
        return result
