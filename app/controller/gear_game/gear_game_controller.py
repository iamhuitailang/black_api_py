from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.gear_game import GearGameBusiness


class SaveGameRequest(BaseModel):
    level: int
    score: int
    max_combo: int
    steps_used: int
    is_win: bool


class GearGameController:
    def __init__(self):
        self.business = GearGameBusiness()

    def ActionGearGameSet(self, request: Request, body: SaveGameRequest):
        """
        保存游戏记录
        POST /api/gear/game/set
        请求体: { level, score, max_combo, steps_used, is_win }
        """
        result = self.business.save_game_record(
            body.level,
            body.score,
            body.max_combo,
            body.steps_used,
            body.is_win
        )
        return result

    def ActionGearGameHighestScore(self, request: Request, level: Optional[int] = Query(None, ge=1)):
        """
        获取最高分
        GET /api/gear_game/highest_score
        参数: level (可选) - 指定关卡
        """
        result = self.business.get_highest_score(level)
        return result

    def ActionGearGameHighestCombo(self, request: Request, level: Optional[int] = Query(None, ge=1)):
        """
        获取最高连击
        GET /api/gear_game/highest_combo
        参数: level (可选) - 指定关卡
        """
        result = self.business.get_highest_combo(level)
        return result

    def ActionGearGameRecords(self, request: Request, 
                                level: Optional[int] = Query(None, ge=1),
                                page: int = Query(1, ge=1),
                                page_size: int = Query(10, ge=1, le=100)):
        """
        获取游戏记录列表（分页）
        GET /api/gear_game/records
        参数: level (可选), page, page_size
        """
        result = self.business.get_records(level, page, page_size)
        return result

    def ActionGearGameStats(self, request: Request, level: Optional[int] = Query(None, ge=1)):
        """
        获取游戏统计信息
        GET /api/gear_game/stats
        参数: level (可选) - 指定关卡
        """
        result = self.business.get_game_stats(level)
        return result
