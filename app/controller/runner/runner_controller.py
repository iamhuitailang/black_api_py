from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field
from app.business.runner import RunnerBusiness


class ScoreSubmitRequest(BaseModel):
    player_name: str = Field(..., max_length=20, description="玩家昵称")
    distance: int = Field(..., ge=0, description="跑过的距离")
    rings: int = Field(..., ge=0, description="收集的金币数")


class RunnerController:
    def __init__(self):
        self.business = RunnerBusiness()

    def ActionRunnerScoresSet(self, request: Request, body: ScoreSubmitRequest):
        """
        提交游戏成绩
        POST /api/runner/scores/set
        请求体: { player_name: "昵称", distance: 距离, rings: 金币数 }
        """
        result = self.business.submit_score(body.player_name, body.distance, body.rings)
        return result

    def ActionRunnerScoresGet(self, request: Request, limit: int = Query(10, ge=1, le=100)):
        """
        获取排行榜数据
        GET /api/runner/scores/get
        参数: limit - 返回记录数，默认10，最大100
        """
        result = self.business.get_leaderboard(limit)
        return result
