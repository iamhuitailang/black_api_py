from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.game import GameBusiness


class SaveScoreRequest(BaseModel):
    player_name: str
    score: int
    wave: int
    kills: int
    energy_collected: int = 0
    boss_killed: bool = False


class GameController:
    def __init__(self):
        self.business = GameBusiness()

    def ActionGameSavescorePost(self, request: Request, body: SaveScoreRequest):
        """
        保存游戏得分
        POST /api/game/savescore
        请求体: { player_name, score, wave, kills, energy_collected, boss_killed }
        """
        result = self.business.save_game_score(
            player_name=body.player_name,
            score=body.score,
            wave=body.wave,
            kills=body.kills,
            energy_collected=body.energy_collected,
            boss_killed=body.boss_killed
        )
        return result

    def ActionGameTopscores(self, request: Request, limit: int = Query(10, ge=1, le=100)):
        """
        获取排行榜（前N名）
        GET /api/game/topscores
        参数: limit - 返回数量（默认10，最大100）
        """
        result = self.business.get_top_scores(limit)
        return result

    def ActionGamePlayerprogress(self, request: Request, player_name: str = Query(..., min_length=1, max_length=50)):
        """
        获取玩家游戏进度
        GET /api/game/playerprogress
        参数: player_name - 玩家名称
        """
        result = self.business.get_player_progress(player_name)
        return result

    def ActionGamePlayerscores(self, request: Request, player_name: str = Query(..., min_length=1, max_length=50)):
        """
        获取玩家历史得分记录
        GET /api/game/playerscores
        参数: player_name - 玩家名称
        """
        result = self.business.get_player_scores(player_name)
        return result

    def ActionGameLeaderboard(self, request: Request, page: int = Query(1, ge=1),
                               page_size: int = Query(10, ge=1, le=100)):
        """
        获取排行榜（分页）
        GET /api/game/leaderboard
        参数: page - 页码, page_size - 每页数量
        """
        result = self.business.get_leaderboard(page, page_size)
        return result

    def ActionGameAllprogress(self, request: Request, limit: int = Query(50, ge=1, le=200)):
        """
        获取所有玩家进度
        GET /api/game/allprogress
        参数: limit - 返回数量（默认50，最大200）
        """
        result = self.business.get_all_progress(limit)
        return result
