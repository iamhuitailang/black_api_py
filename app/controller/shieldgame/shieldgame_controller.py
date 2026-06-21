from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.shieldgame import ShieldGameBusiness


class GameRecordSubmitRequest(BaseModel):
    player_name: str = "Player"
    level: int
    cleared: int = 0
    final_hp: int = 0
    final_shield_durability: int = 0
    shield_broken: int = 0
    total_damage_dealt: int = 0
    total_damage_taken: int = 0
    play_time_seconds: int = 0
    shield_bash_count: int = 0
    shield_smash_count: int = 0
    shield_block_count: int = 0
    total_damage_blocked: int = 0
    shield_durability_lost: int = 0
    repaired_times: int = 0
    repaired_amount: int = 0


class ShieldGameController:
    def __init__(self):
        self.business = ShieldGameBusiness()

    def ActionShieldgameSubmitPost(self, request: Request, body: GameRecordSubmitRequest):
        """
        提交游戏记录
        POST /api/shieldgame/submit
        """
        data = body.model_dump()
        result = self.business.submit_game_record(data)
        return result

    def ActionShieldgameGetplayerrecords(self, request: Request, player_name: str = Query(...)):
        """
        获取玩家游戏记录
        GET /api/shieldgame/getplayerrecords
        """
        result = self.business.get_player_records(player_name)
        return result

    def ActionShieldgameGetclearedlevels(self, request: Request, player_name: str = Query(...)):
        """
        获取玩家已通关关卡
        GET /api/shieldgame/getclearedlevels
        """
        result = self.business.get_cleared_levels(player_name)
        return result

    def ActionShieldgameGetshieldstats(self, request: Request, player_name: str = Query(...)):
        """
        获取玩家盾牌使用统计
        GET /api/shieldgame/getshieldstats
        """
        result = self.business.get_player_shield_stats(player_name)
        return result

    def ActionShieldgameGetleaderboard(self, request: Request, level: int = Query(1, ge=1, le=8), 
                                         limit: int = Query(10, ge=1, le=100)):
        """
        获取关卡排行榜
        GET /api/shieldgame/getleaderboard
        """
        result = self.business.get_level_leaderboard(level, limit)
        return result

    def ActionShieldgameGetallrecords(self, request: Request, page: int = Query(1, ge=1), 
                                       page_size: int = Query(10, ge=1, le=100)):
        """
        获取所有游戏记录（分页）
        GET /api/shieldgame/getallrecords
        """
        result = self.business.get_all_records(page, page_size)
        return result
