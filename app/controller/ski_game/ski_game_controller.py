from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.ski_game import SkiGameBusiness


class ScoreSetRequest(BaseModel):
    player_name: str
    score: int
    distance: float
    max_speed: float
    gates_passed: int
    slope_level: int


class SkiGameController:
    def __init__(self):
        self.business = SkiGameBusiness()

    def ActionSkigameScoreSet(self, request: Request, body: ScoreSetRequest):
        """
        提交游戏成绩
        POST /api/skigame/score/set
        请求体: { player_name, score, distance, max_speed, gates_passed, slope_level }
        """
        result = self.business.submit_score(
            body.player_name,
            body.score,
            body.distance,
            body.max_speed,
            body.gates_passed,
            body.slope_level
        )
        return result

    def ActionSkigameScoreToplist(self, request: Request, limit: int = Query(10, ge=1, le=100)):
        """
        获取排行榜
        GET /api/skigame/score/toplist
        参数: limit - 排行榜数量 (1-100)
        """
        result = self.business.get_top_scores(limit)
        return result

    def ActionSkigameScoreGet(self, request: Request, id: int = Query(..., ge=1)):
        """
        获取单条成绩
        GET /api/skigame/score/get
        参数: id - 成绩ID
        """
        result = self.business.get_score_by_id(id)
        return result

    def ActionSkigameScoreGetlist(self, request: Request, page: int = Query(1, ge=1),
                                  page_size: int = Query(10, ge=1, le=100)):
        """
        获取成绩列表（分页）
        GET /api/skigame/score/getlist
        参数: page - 页码, page_size - 每页数量
        """
        result = self.business.get_score_list(page, page_size)
        return result

    def ActionSkigameScoreDelete(self, request: Request, id: int = Query(..., ge=1)):
        """
        删除成绩
        DELETE /api/skigame/score/delete
        参数: id - 要删除的成绩ID
        """
        result = self.business.delete_score(id)
        return result
