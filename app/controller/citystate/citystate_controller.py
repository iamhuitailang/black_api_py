from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.citystate import CityStateBusiness


class BuildRequest(BaseModel):
    player_id: str
    building_type: str
    grid_x: int
    grid_y: int


class DemolishRequest(BaseModel):
    player_id: str
    building_id: int


class TradeRequest(BaseModel):
    player_id: str
    from_resource: str
    to_resource: str
    amount: int


class InvasionRequest(BaseModel):
    player_id: str


class SeasonRequest(BaseModel):
    player_id: str


class CitystateController:
    def __init__(self):
        self.business = CityStateBusiness()

    def ActionCitystateInit(self, request: Request, player_id: Optional[str] = Query(None)):
        """
        初始化游戏
        GET /api/citystate/init
        参数: player_id (可选) - 玩家ID，不提供则自动生成
        """
        result = self.business.init_game(player_id)
        return result

    def ActionCitystateStateGet(self, request: Request, player_id: str = Query(..., min_length=1)):
        """
        获取游戏状态
        GET /api/citystate/state/get
        参数: player_id - 玩家ID
        """
        result = self.business.get_game_state(player_id)
        return result

    def ActionCitystateBuildSet(self, request: Request, body: BuildRequest):
        """
        建造建筑
        POST /api/citystate/build
        请求体: { player_id, building_type, grid_x, grid_y }
        """
        result = self.business.build_structure(
            player_id=body.player_id,
            building_type=body.building_type,
            grid_x=body.grid_x,
            grid_y=body.grid_y
        )
        return result

    def ActionCitystateDemolishSet(self, request: Request, body: DemolishRequest):
        """
        拆除建筑
        POST /api/citystate/demolish
        请求体: { player_id, building_id }
        """
        result = self.business.demolish_structure(
            player_id=body.player_id,
            building_id=body.building_id
        )
        return result

    def ActionCitystateTradeSet(self, request: Request, body: TradeRequest):
        """
        资源交易
        POST /api/citystate/trade
        请求体: { player_id, from_resource, to_resource, amount }
        """
        result = self.business.trade_resources(
            player_id=body.player_id,
            from_resource=body.from_resource,
            to_resource=body.to_resource,
            amount=body.amount
        )
        return result

    def ActionCitystateInvasionTriggerSet(self, request: Request, body: InvasionRequest):
        """
        触发蛮族入侵（仅冬季可用）
        POST /api/citystate/invasion/trigger
        请求体: { player_id }
        """
        result = self.business.trigger_invasion(player_id=body.player_id)
        return result

    def ActionCitystateInvasionHistoryGet(self, request: Request, player_id: str = Query(..., min_length=1),
                                          limit: int = Query(10, ge=1, le=50)):
        """
        获取入侵历史
        GET /api/citystate/invasion/history/get
        参数: player_id - 玩家ID, limit - 历史记录数量
        """
        result = self.business.get_invasion_history(player_id, limit)
        return result

    def ActionCitystateSeasonAdvanceSet(self, request: Request, body: SeasonRequest):
        """
        推进到下一个季节
        POST /api/citystate/season/advance
        请求体: { player_id }
        """
        result = self.business.advance_season(player_id=body.player_id)
        return result
