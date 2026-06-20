from typing import Optional
from fastapi import Query, Request
from pydantic import BaseModel
from app.business.game import LeaderboardBusiness


class ScoreSubmitRequest(BaseModel):
    player_name: str = 'Anonymous'
    score: int
    time_spent: float
    hp_remaining: int


class GameController:
    def __init__(self):
        self.business = LeaderboardBusiness()

    def ActionGameSubmitPost(self, request: Request, body: ScoreSubmitRequest):
        """
        Submit game score to leaderboard
        POST /api/game/submit
        """
        result = self.business.submit_score(body.player_name, body.score, body.time_spent, body.hp_remaining)
        return result

    def ActionGameLeaderboardGet(self, request: Request, limit: int = Query(10, ge=1, le=100)):
        """
        Get leaderboard ranked by score
        GET /api/game/leaderboard
        """
        result = self.business.get_leaderboard(limit)
        return result
