from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field
from app.business.cyber_ninja import CyberNinjaBusiness


class SubmitScoreRequest(BaseModel):
    player_name: str = Field(default="匿名忍者", max_length=20, description="玩家名称")
    score: int = Field(ge=0, description="游戏得分")
    level: int = Field(ge=1, default=1, description="到达的关卡")


class CyberNinjaController:
    def __init__(self):
        self.business = CyberNinjaBusiness()

    def ActionCyberNinjaSubmitScore(self, request: Request, body: SubmitScoreRequest):
        """
        提交游戏成绩
        POST /api/cyber_ninja/submit_score
        请求体: { player_name: "玩家名", score: 分数, level: 关卡 }
        """
        result = self.business.submit_score(body.player_name, body.score, body.level)
        return result

    def ActionCyberNinjaGetLeaderboard(self, request: Request, limit: int = Query(10, ge=1, le=100)):
        """
        获取排行榜
        GET /api/cyber_ninja/leaderboard
        参数: limit - 返回数量 (1-100)
        """
        result = self.business.get_leaderboard(limit)
        return result

    def ActionCyberNinjaGetPlayerBest(self, request: Request, player_name: str = Query(..., max_length=20)):
        """
        获取玩家最佳成绩
        GET /api/cyber_ninja/player_best
        参数: player_name - 玩家名称
        """
        result = self.business.get_player_best(player_name)
        return result

    def ActionCyberNinjaGetAllScores(self, request: Request, 
                                     page: int = Query(1, ge=1), 
                                     page_size: int = Query(10, ge=1, le=100)):
        """
        获取所有成绩（分页）
        GET /api/cyber_ninja/scores
        参数: page - 页码, page_size - 每页数量
        """
        result = self.business.get_all_scores(page, page_size)
        return result
