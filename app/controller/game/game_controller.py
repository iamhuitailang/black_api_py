from typing import Optional, List
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.game import GameBusiness


class BattleRecordRequest(BaseModel):
    player_name: str = 'player'
    floor: int
    result: str
    player_hp_remaining: int = 0
    enemy_hp_remaining: int = 0
    battle_duration: int = 0
    actions_used: str = ''


class GameController:
    def __init__(self):
        self.business = GameBusiness()

    def ActionGameProgressGet(self, request: Request, player_name: str = Query('player')):
        """
        获取玩家游戏进度
        GET /api/game/progress/get
        参数: player_name - 玩家名称
        """
        result = self.business.get_player_progress(player_name)
        return result

    def ActionGameBattleRecordPost(self, request: Request, body: BattleRecordRequest):
        """
        记录战斗结果
        POST /api/game/battle/record
        请求体: { player_name, floor, result, player_hp_remaining, enemy_hp_remaining, battle_duration, actions_used }
        """
        result = self.business.record_battle_result(
            player_name=body.player_name,
            floor=body.floor,
            result=body.result,
            player_hp_remaining=body.player_hp_remaining,
            enemy_hp_remaining=body.enemy_hp_remaining,
            battle_duration=body.battle_duration,
            actions_used=body.actions_used
        )
        return result

    def ActionGameBattleRecordsGet(self, request: Request, 
                                player_name: Optional[str] = Query(None),
                                floor: Optional[int] = Query(None),
                                limit: int = Query(50, ge=1, le=200)):
        """
        获取战斗记录列表
        GET /api/game/battle/records/get
        参数: player_name (可选), floor (可选), limit
        """
        result = self.business.get_battle_records(player_name, floor, limit)
        return result

    def ActionGameProgressResetPost(self, request: Request, player_name: str = Query('player')):
        """
        重置玩家游戏进度
        POST /api/game/progress/reset
        参数: player_name
        """
        result = self.business.reset_progress(player_name)
        return result
