from typing import Optional
from fastapi import Query, Request
from pydantic import BaseModel
from app.business.alchemy import AlchemyBusiness


class GameStartRequest(BaseModel):
    player_name: str

class GameEndRequest(BaseModel):
    player_name: str
    score: int
    details: str = ''

class ForgingValidateRequest(BaseModel):
    material_1: str
    material_2: str
    forging_temp: int


class AlchemyController:
    def __init__(self):
        self.business = AlchemyBusiness()

    def ActionAlchemyRecipeGet(self, request: Request):
        """
        获取所有锻造配方
        GET /api/alchemy/recipe/get
        """
        return self.business.get_recipes()

    def ActionAlchemyGameStartPost(self, request: Request, body: GameStartRequest):
        """
        开始新游戏
        POST /api/alchemy/game/start
        """
        return self.business.start_game(body.player_name)

    def ActionAlchemyGameEndPost(self, request: Request, body: GameEndRequest):
        """
        结束游戏并记录分数
        POST /api/alchemy/game/end
        """
        return self.business.end_game(body.player_name, body.score, body.details)

    def ActionAlchemyLeaderboardGet(self, request: Request, limit: int = Query(20, ge=1, le=100)):
        """
        获取排行榜
        GET /api/alchemy/leaderboard/get
        """
        return self.business.get_leaderboard(limit)

    def ActionAlchemyForgingValidatePost(self, request: Request, body: ForgingValidateRequest):
        """
        验证锻造操作
        POST /api/alchemy/forging/validate
        """
        return self.business.validate_forging(body.material_1, body.material_2, body.forging_temp)
