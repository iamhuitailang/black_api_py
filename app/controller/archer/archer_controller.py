from typing import Optional
from fastapi import Query, Request
from pydantic import BaseModel
from app.business.archer import ArcherBusiness


class ArcherSubmitRequest(BaseModel):
    player_name: str
    wave: int
    score: int


class ArcherController:
    def __init__(self):
        self.business = ArcherBusiness()

    def ActionArcherSubmitPost(self, request: Request, body: ArcherSubmitRequest):
        """
        提交游戏成绩
        POST /api/archer/submit
        请求体: { player_name: "玩家名", wave: 波数, score: 分数 }
        """
        result = self.business.submit_score(body.player_name, body.wave, body.score)
        return result

    def ActionArcherGetleaderboard(self, request: Request, limit: int = Query(10, ge=1, le=100)):
        """
        获取排行榜
        GET /api/archer/getleaderboard
        参数: limit - 排行榜数量 (默认10，最大100)
        """
        result = self.business.get_leaderboard(limit)
        return result

    def ActionArcherGetplayerbest(self, request: Request, player_name: str = Query(...)):
        """
        获取玩家最佳成绩
        GET /api/archer/getplayerbest
        参数: player_name - 玩家名
        """
        result = self.business.get_player_best(player_name)
        return result
