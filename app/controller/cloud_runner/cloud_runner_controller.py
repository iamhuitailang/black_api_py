from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.cloud_runner import CloudRunnerBusiness


class ScoreSubmitRequest(BaseModel):
    player_name: str
    score: int
    distance: float


class CloudRunnerController:
    def __init__(self):
        self.business = CloudRunnerBusiness()

    def ActionCloudRunnerScoreSubmitPost(self, request: Request, body: ScoreSubmitRequest):
        """
        提交游戏分数
        POST /api/cloud/runner/score/submit
        请求体: { player_name: str, score: int, distance: float }
        """
        result = self.business.submit_score(body.player_name, body.score, body.distance)
        return result

    def ActionCloudRunnerLeaderboardGet(self, request: Request, limit: int = Query(10, ge=1, le=100)):
        """
        获取排行榜
        GET /api/cloud/runner/leaderboard/get
        参数: limit - 获取前几名（默认10）
        """
        result = self.business.get_leaderboard(limit)
        return result
