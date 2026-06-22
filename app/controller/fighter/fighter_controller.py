from typing import Optional, Dict, Any
from fastapi import Query, Request
from pydantic import BaseModel
from app.business.fighter import FighterBattleBusiness


class ExecuteRoundRequest(BaseModel):
    state: Dict[str, Any]
    action: str


class FighterController:
    def __init__(self):
        self.business = FighterBattleBusiness()

    def ActionFighterActivebattleGet(self, request: Request):
        """
        获取当前活跃战斗状态
        GET /api/fighter/activebattle/get
        """
        result = self.business.get_active_battle()
        return result

    def ActionFighterNewbattleGet(self, request: Request):
        """
        创建新战斗
        GET /api/fighter/newbattle/get
        """
        result = self.business.create_new_battle()
        return result

    def ActionFighterExecuteroundPost(self, request: Request, body: ExecuteRoundRequest):
        """
        执行一回合
        POST /api/fighter/executeround
        参数: state - 当前战斗状态, action - 玩家动作(light/heavy/defend)
        """
        result = self.business.execute_round(body.state, body.action)
        return result

    def ActionFighterRecordsGet(self, request: Request, limit: int = Query(10, ge=1, le=100)):
        """
        获取对战记录
        GET /api/fighter/records/get
        参数: limit - 返回记录数量
        """
        result = self.business.get_battle_records(limit)
        return result

    def ActionFighterStatsGet(self, request: Request):
        """
        获取战斗统计数据
        GET /api/fighter/stats/get
        """
        result = self.business.get_battle_stats()
        return result
