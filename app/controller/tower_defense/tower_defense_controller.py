from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.tower_defense import TowerDefenseBusiness


class ScoreSubmitRequest(BaseModel):
    player_name: str
    wave_cleared: int
    score: int


class TowerDefenseController:
    def __init__(self):
        self.business = TowerDefenseBusiness()

    def ActionTowerDefenseScoreSubmit(self, request: Request, body: ScoreSubmitRequest):
        """
        提交塔防游戏成绩
        POST /api/tower_defense/score/submit
        请求体: { player_name: "玩家名", wave_cleared: 通关波数, score: 分数 }
        """
        result = self.business.submit_score(body.player_name, body.wave_cleared, body.score)
        return result

    def ActionTowerDefenseLeaderboardGet(self, request: Request, limit: int = Query(10, ge=1, le=100)):
        """
        获取塔防游戏排行榜
        GET /api/tower_defense/leaderboard/get
        参数: limit - 返回数量（默认10，最大100）
        """
        result = self.business.get_leaderboard(limit)
        return result

    def ActionTowerDefenseScoreGetlist(self, request: Request, page: int = Query(1, ge=1),
                                         page_size: int = Query(10, ge=1, le=100)):
        """
        获取塔防游戏成绩列表（分页）
        GET /api/tower_defense/score/getlist
        参数: page - 页码, page_size - 每页数量
        """
        result = self.business.get_all_scores(page, page_size)
        return result
