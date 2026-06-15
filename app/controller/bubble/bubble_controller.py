from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.bubble import BubbleBusiness


class SubmitScoreRequest(BaseModel):
    player_name: str
    score: int
    level: int = 1


class BubbleController:
    def __init__(self):
        self.business = BubbleBusiness()

    def ActionBubbleSubmitScorePost(self, request: Request, body: SubmitScoreRequest):
        """
        提交游戏成绩
        POST /api/bubble/submit_score
        请求体: { player_name: "玩家名", score: 得分, level: 关卡 }
        """
        result = self.business.submit_score(body.player_name, body.score, body.level)
        return result

    def ActionBubbleLeaderboardGet(self, request: Request, limit: int = Query(100, ge=1, le=500)):
        """
        获取排行榜
        GET /api/bubble/leaderboard
        参数: limit - 返回数量限制（默认100，最大500）
        """
        result = self.business.get_leaderboard(limit)
        return result

    def ActionBubbleLeaderboardPaginateGet(self, request: Request, page: int = Query(1, ge=1),
                                              page_size: int = Query(20, ge=1, le=100)):
        """
        获取排行榜（分页）
        GET /api/bubble/leaderboard/paginate
        参数: page - 页码, page_size - 每页数量
        """
        result = self.business.get_leaderboard_paginated(page, page_size)
        return result
