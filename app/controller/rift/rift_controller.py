from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.rift import RiftBusiness


class SealRequest(BaseModel):
    game_id: int
    mode: str
    tracker_x: int
    tracker_y: int


class AnchorRequest(BaseModel):
    game_id: int
    segment_id: int


class MoveTrackerRequest(BaseModel):
    game_id: int
    tracker_x: int
    tracker_y: int


class RiftController:
    def __init__(self):
        self.business = RiftBusiness()

    def ActionRiftStartPost(self, request: Request):
        """
        创建新游戏
        POST /api/rift/start
        """
        result = self.business.create_game()
        return result

    def ActionRiftActive(self, request: Request):
        """
        获取当前进行中的游戏状态
        GET /api/rift/active
        """
        result = self.business.get_active_game()
        return result

    def ActionRiftState(self, request: Request, game_id: int = Query(..., ge=1)):
        """
        获取指定游戏状态
        GET /api/rift/state
        参数: game_id - 游戏ID
        """
        result = self.business.get_game_state(game_id)
        return result

    def ActionRiftSealPost(self, request: Request, body: SealRequest):
        """
        执行封堵操作
        POST /api/rift/seal
        请求体: { game_id, mode: slow|medium|fast, tracker_x, tracker_y }
        """
        result = self.business.execute_seal(
            game_id=body.game_id,
            mode=body.mode,
            tracker_x=body.tracker_x,
            tracker_y=body.tracker_y
        )
        return result

    def ActionRiftAnchorPost(self, request: Request, body: AnchorRequest):
        """
        部署时空锚点
        POST /api/rift/anchor
        请求体: { game_id, segment_id }
        """
        result = self.business.deploy_anchor(
            game_id=body.game_id,
            segment_id=body.segment_id
        )
        return result

    def ActionRiftMovetrackerPost(self, request: Request, body: MoveTrackerRequest):
        """
        移动追踪器
        POST /api/rift/movetracker
        请求体: { game_id, tracker_x, tracker_y }
        """
        result = self.business.move_tracker(
            game_id=body.game_id,
            tracker_x=body.tracker_x,
            tracker_y=body.tracker_y
        )
        return result

    def ActionRiftList(self, request: Request, page: int = Query(1, ge=1),
                       page_size: int = Query(10, ge=1, le=100)):
        """
        获取游戏历史列表
        GET /api/rift/list
        参数: page - 页码, page_size - 每页数量
        """
        result = self.business.get_games(page, page_size)
        return result
