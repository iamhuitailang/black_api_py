from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.train import TrainBusiness


class TrainUpgradeRequest(BaseModel):
    carriage_type: str


class TrainRepairRequest(BaseModel):
    carriage_type: str
    amount: Optional[int] = 20


class TrainTickRequest(BaseModel):
    delta_seconds: Optional[float] = 1.0


class TrainController:
    def __init__(self):
        self.business = TrainBusiness()

    def ActionTrainStartPost(self, request: Request):
        """
        启动新游戏
        POST /api/train/start
        """
        result = self.business.start_new_game()
        return result

    def ActionTrainStateGet(self, request: Request):
        """
        获取当前游戏状态
        GET /api/train/state
        """
        result = self.business.get_game_state()
        return result

    def ActionTrainTickPost(self, request: Request, body: TrainTickRequest):
        """
        推进游戏一个时间步长
        POST /api/train/tick
        请求体: { delta_seconds: 时间步长(秒) }
        """
        result = self.business.tick(body.delta_seconds)
        return result

    def ActionTrainFirePost(self, request: Request):
        """
        武器舱开火（对抗劫匪）
        POST /api/train/fire
        """
        result = self.business.fire_weapon()
        return result

    def ActionTrainClearroadblockPost(self, request: Request):
        """
        清除路障（消耗物资）
        POST /api/train/clearroadblock
        """
        result = self.business.clear_roadblock()
        return result

    def ActionTrainSwitchtrackPost(self, request: Request):
        """
        切换轨道（应对桥梁断裂）
        POST /api/train/switchtrack
        """
        result = self.business.switch_track()
        return result

    def ActionTrainRefuelPost(self, request: Request):
        """
        加油（在加油站）
        POST /api/train/refuel
        """
        result = self.business.refuel()
        return result

    def ActionTrainUpgradePost(self, request: Request, body: TrainUpgradeRequest):
        """
        升级车厢
        POST /api/train/upgrade
        请求体: { carriage_type: "cockpit" | "cargo" | "weapon" }
        """
        result = self.business.upgrade_carriage(body.carriage_type)
        return result

    def ActionTrainRepairPost(self, request: Request, body: TrainRepairRequest):
        """
        修复车厢
        POST /api/train/repair
        请求体: { carriage_type: "...", amount: 修复血量 }
        """
        result = self.business.repair_carriage(body.carriage_type, body.amount)
        return result

    def ActionTrainEventsGet(self, request: Request, limit: int = Query(20, ge=1, le=100)):
        """
        获取最近事件日志
        GET /api/train/events
        参数: limit - 返回数量
        """
        result = self.business.get_recent_events(limit)
        return result
