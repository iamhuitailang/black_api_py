from typing import Optional
from fastapi import Query, Request
from pydantic import BaseModel
from app.business.game import ScoreBusiness


class ScoreSubmitRequest(BaseModel):
    player_name: str = '剑客'
    level_id: int
    completion_time: float
    damage_taken: int
    collectibles: int
    max_collectibles: int


class GameController:
    def __init__(self):
        self.business = ScoreBusiness()

    def ActionGameScoreSet(self, request: Request, body: ScoreSubmitRequest):
        """
        提交通关评分
        POST /api/game/score/set
        """
        result = self.business.submit_score(
            player_name=body.player_name,
            level_id=body.level_id,
            completion_time=body.completion_time,
            damage_taken=body.damage_taken,
            collectibles=body.collectibles,
            max_collectibles=body.max_collectibles
        )
        return result

    def ActionGameScoreGet(self, request: Request, level_id: int = Query(..., ge=1, le=10),
                            limit: int = Query(20, ge=1, le=100)):
        """
        获取指定关卡评分列表
        GET /api/game/score/get
        """
        result = self.business.get_level_scores(level_id, limit)
        return result

    def ActionGameRankingGet(self, request: Request, limit: int = Query(20, ge=1, le=100)):
        """
        获取全关总评分排行
        GET /api/game/ranking/get
        """
        result = self.business.get_ranking(limit)
        return result

    def ActionGameProgressGet(self, request: Request, player_name: str = Query(..., min_length=1)):
        """
        获取玩家进度
        GET /api/game/progress/get
        """
        result = self.business.get_player_progress(player_name)
        return result
