from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.asteroid import AsteroidBusiness


class ScoreSubmitRequest(BaseModel):
    player_name: str
    score: int
    wave: int


class AsteroidController:
    def __init__(self):
        self.business = AsteroidBusiness()

    def ActionAsteroidSubmitSet(self, request: Request, body: ScoreSubmitRequest):
        """
        提交游戏成绩
        POST /api/asteroid/submit/set
        """
        result = self.business.submit_score(body.player_name, body.score, body.wave)
        return result

    def ActionAsteroidLeaderboardGet(self, request: Request):
        """
        获取排行榜TOP20
        GET /api/asteroid/leaderboard/get
        """
        result = self.business.get_leaderboard()
        return result
