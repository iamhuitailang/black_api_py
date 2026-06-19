from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.fighter import FighterBusiness


class FighterSaveBattleRequest(BaseModel):
    player1_character: str
    player2_character: str
    player1_wins: int
    player2_wins: int
    winner: str
    winner_character: str
    total_rounds: int
    max_combo_p1: Optional[int] = 0
    max_combo_p2: Optional[int] = 0


class FighterController:
    def __init__(self):
        self.business = FighterBusiness()

    def ActionFighterCharactersGet(self, request: Request):
        """
        获取可选角色列表
        GET /api/fighter/characters/get
        """
        return self.business.get_available_characters()

    def ActionFighterStatsGet(self, request: Request):
        """
        获取角色使用率和胜率统计
        GET /api/fighter/stats/get
        """
        return self.business.get_character_statistics()

    def ActionFighterBattleGetlist(self, request: Request, page: int = Query(1, ge=1),
                                    page_size: int = Query(10, ge=1, le=100)):
        """
        获取对战记录列表（分页）
        GET /api/fighter/battle/getlist
        参数: page - 页码, page_size - 每页数量
        """
        return self.business.get_battle_records(page, page_size)

    def ActionFighterBattleSet(self, request: Request, body: FighterSaveBattleRequest):
        """
        保存对战记录
        POST /api/fighter/battle/set
        """
        return self.business.save_battle_result(
            player1_character=body.player1_character,
            player2_character=body.player2_character,
            player1_wins=body.player1_wins,
            player2_wins=body.player2_wins,
            winner=body.winner,
            winner_character=body.winner_character,
            total_rounds=body.total_rounds,
            max_combo_p1=body.max_combo_p1,
            max_combo_p2=body.max_combo_p2
        )
