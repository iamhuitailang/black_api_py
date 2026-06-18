from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.fortress import FortressBusiness


class BuildRequest(BaseModel):
    state_id: int
    building_type: str
    position_x: int
    position_y: int


class CollectResourceRequest(BaseModel):
    state_id: int
    resource_type: str
    amount: int


class AdvanceTimeRequest(BaseModel):
    state_id: int
    delta: Optional[float] = 0.1


class FortressController:
    def __init__(self):
        self.business = FortressBusiness()

    def ActionFortressNewgamePost(self, request: Request):
        """
        创建新游戏
        POST /api/fortress/newgame
        """
        result = self.business.new_game()
        return result

    def ActionFortressGetstate(self, request: Request, state_id: Optional[int] = Query(None)):
        """
        获取游戏状态
        GET /api/fortress/getstate
        """
        result = self.business.get_game_state(state_id)
        return result

    def ActionFortressBuildPost(self, request: Request, body: BuildRequest):
        """
        建造防御工事
        POST /api/fortress/build
        """
        result = self.business.build_structure(
            body.state_id,
            body.building_type,
            body.position_x,
            body.position_y
        )
        return result

    def ActionFortressAdvancetimePost(self, request: Request, body: AdvanceTimeRequest):
        """
        推进游戏时间
        POST /api/fortress/advancetime
        """
        result = self.business.advance_time(body.state_id, body.delta)
        return result

    def ActionFortressCollectresourcePost(self, request: Request, body: CollectResourceRequest):
        """
        收集/制作资源
        POST /api/fortress/collectresource
        """
        result = self.business.collect_resources(
            body.state_id,
            body.resource_type,
            body.amount
        )
        return result

    def ActionFortressGetsavelist(self, request: Request):
        """
        获取存档列表
        GET /api/fortress/getsavelist
        """
        result = self.business.get_save_list()
        return result

    def ActionFortressSaveDelete(self, request: Request, state_id: int = Query(..., ge=1)):
        """
        删除存档
        DELETE /api/fortress/save/delete
        """
        result = self.business.delete_save(state_id)
        return result

    def ActionFortressGetwormpositions(self, request: Request, state_id: int = Query(..., ge=1)):
        """
        获取沙虫位置（需要震地鼓）
        GET /api/fortress/getwormpositions
        """
        result = self.business.get_worm_positions(state_id)
        return result
