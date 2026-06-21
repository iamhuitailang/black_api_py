from typing import Optional, Dict, Any
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field
from app.business.glacier import GlacierBusiness


class GameIdRequest(BaseModel):
    game_id: int = Field(..., ge=1, description="游戏ID")


class GlacierController:
    def __init__(self):
        self.glacier_business = GlacierBusiness()

    def ActionGlacierNewGamePost(self, request: Request):
        """
        创建新游戏
        POST /api/glacier/new/game
        初始化新的冰川渗透游戏，生成小队和冰层
        """
        return self.glacier_business.new_game()

    def ActionGlacierStateGet(self, request: Request, game_id: int = Query(..., ge=1, description="游戏ID")):
        """
        获取游戏状态
        GET /api/glacier/state/get
        获取指定游戏的当前状态，包括冰层、小队、体能等信息
        """
        return self.glacier_business.get_game_state(game_id)

    def ActionGlacierDigPost(self, request: Request, body: GameIdRequest):
        """
        执行挖掘操作
        POST /api/glacier/dig
        小队全员进行一回合挖掘，消耗体能和耐寒值
        """
        return self.glacier_business.dig(body.game_id)

    def ActionGlacierCrackUsePost(self, request: Request, body: GameIdRequest):
        """
        使用裂缝通道
        POST /api/glacier/crack/use
        跳过当前层直接进入下层，需要体能够且已发现裂缝
        """
        return self.glacier_business.use_crack(body.game_id)

    def ActionGlacierSupplyUsePost(self, request: Request, body: GameIdRequest):
        """
        使用补给站
        POST /api/glacier/supply/use
        使用当前层的补给站，有概率触发陷阱
        """
        return self.glacier_business.use_supply(body.game_id)

    def ActionGlacierLatestGet(self, request: Request):
        """
        获取最近的游戏
        GET /api/glacier/latest/get
        获取最近创建的游戏状态
        """
        return self.glacier_business.get_latest_game()
