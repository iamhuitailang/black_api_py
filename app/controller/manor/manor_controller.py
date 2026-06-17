from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.manor import ManorBusiness


class StartGameRequest(BaseModel):
    player_name: Optional[str] = 'player'


class MoveRequest(BaseModel):
    player_name: str
    target_room: str


class CollectItemRequest(BaseModel):
    player_name: str
    item_id: str


class SolvePuzzleRequest(BaseModel):
    player_name: str
    puzzle_type: str


class ManorController:
    def __init__(self):
        self.business = ManorBusiness()

    def ActionManorStartPost(self, request: Request, body: StartGameRequest):
        """
        开始新游戏
        POST /api/manor/start
        """
        result = self.business.start_new_game(body.player_name)
        return result

    def ActionManorStateGet(self, request: Request, player_name: str = Query('player')):
        """
        获取游戏状态
        GET /api/manor/state
        """
        result = self.business.get_game_state(player_name)
        return result

    def ActionManorMovePost(self, request: Request, body: MoveRequest):
        """
        移动到指定房间
        POST /api/manor/move
        """
        result = self.business.move_to_room(body.player_name, body.target_room)
        return result

    def ActionManorCollectPost(self, request: Request, body: CollectItemRequest):
        """
        拾取物品
        POST /api/manor/collect
        """
        result = self.business.collect_item(body.player_name, body.item_id)
        return result

    def ActionManorPuzzlePost(self, request: Request, body: SolvePuzzleRequest):
        """
        解开机关
        POST /api/manor/puzzle
        """
        result = self.business.solve_puzzle(body.player_name, body.puzzle_type)
        return result

    def ActionManorMapGet(self, request: Request, player_name: str = Query('player')):
        """
        获取庄园地图
        GET /api/manor/map
        """
        result = self.business.get_map(player_name)
        return result

    def ActionManorFlashlightGet(self, request: Request, player_name: str = Query('player')):
        """
        使用手电筒
        GET /api/manor/flashlight
        """
        result = self.business.use_flashlight(player_name)
        return result
