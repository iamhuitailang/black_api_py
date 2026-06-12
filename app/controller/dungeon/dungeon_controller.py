from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field
from app.business.dungeon import DungeonBusiness


class ScoreSubmitRequest(BaseModel):
    player_name: str = Field(..., min_length=1, max_length=50)
    depth: int = Field(..., ge=0)
    kills: int = Field(..., ge=0)
    gold: int = Field(..., ge=0)


class DungeonController:
    def __init__(self):
        self.business = DungeonBusiness()

    def ActionDungeonScoreSubmitPost(self, request: Request, body: ScoreSubmitRequest):
        """
        提交地牢探索分数记录
        POST /api/dungeon/score/submit
        请求体: { player_name: "玩家名", depth: 层数, kills: 杀敌数, gold: 金币数 }
        """
        result = self.business.submit_score(
            body.player_name,
            body.depth,
            body.kills,
            body.gold
        )
        return result

    def ActionDungeonScoreGetlist(self, request: Request, 
                                    limit: int = Query(10, ge=1, le=100),
                                    sort_by: str = Query('gold', pattern='^(gold|depth)$')):
        """
        获取地牢排行榜
        GET /api/dungeon/score/getlist
        参数: limit - 数量, sort_by - 排序方式(gold/depth)
        """
        result = self.business.get_leaderboard(limit, sort_by)
        return result

    def ActionDungeonScoreGetbest(self, request: Request, player_name: str = Query(..., min_length=1, max_length=50)):
        """
        获取玩家最佳记录
        GET /api/dungeon/score/getbest
        参数: player_name - 玩家名
        """
        result = self.business.get_player_best(player_name)
        return result

    def ActionDungeonScoreGetpage(self, request: Request,
                                   page: int = Query(1, ge=1),
                                   page_size: int = Query(10, ge=1, le=100)):
        """
        分页获取分数列表
        GET /api/dungeon/score/getpage
        参数: page - 页码, page_size - 每页数量
        """
        result = self.business.get_scores_paginated(page, page_size)
        return result
