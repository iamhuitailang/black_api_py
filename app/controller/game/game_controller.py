from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field
from app.business.game import GameBusiness


class SubmitScoreRequest(BaseModel):
    player_name: str = Field(..., max_length=20, description="玩家名称")
    score: int = Field(..., ge=0, description="总分数")
    towers_destroyed: int = Field(..., ge=0, description="总击毁塔数")
    stage1_destroyed: int = Field(..., ge=0, description="第1场击毁数")
    stage2_destroyed: int = Field(..., ge=0, description="第2场击毁数")
    stage3_destroyed: int = Field(..., ge=0, description="第3场击毁数")
    remaining_hp: int = Field(..., ge=0, description="剩余血量")
    stages_cleared: int = Field(..., ge=0, le=3, description="通关场数")


class GameController:
    def __init__(self):
        self.business = GameBusiness()

    def ActionGameSubmitPost(self, request: Request, body: SubmitScoreRequest):
        """
        提交游戏成绩到排行榜
        POST /api/game/submit
        请求体: 玩家信息和成绩数据
        """
        result = self.business.submit_score(
            player_name=body.player_name,
            score=body.score,
            towers_destroyed=body.towers_destroyed,
            stage1_destroyed=body.stage1_destroyed,
            stage2_destroyed=body.stage2_destroyed,
            stage3_destroyed=body.stage3_destroyed,
            remaining_hp=body.remaining_hp,
            stages_cleared=body.stages_cleared
        )
        return result

    def ActionGameLeaderboardGet(self, request: Request, limit: int = Query(50, ge=1, le=200)):
        """
        获取游戏排行榜
        GET /api/game/leaderboard
        参数: limit - 返回记录数量
        """
        result = self.business.get_leaderboard(limit=limit)
        return result

    def ActionGameTopGet(self, request: Request):
        """
        获取排行榜Top 10
        GET /api/game/top
        """
        result = self.business.get_top_10()
        return result
