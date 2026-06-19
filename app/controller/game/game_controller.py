from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.game import GameBusiness


class RegisterPlayerRequest(BaseModel):
    player_name: str


class SaveCheckpointRequest(BaseModel):
    player_id: int
    game_save_id: int
    checkpoint_distance: int
    arrival_time: float
    kills_at_checkpoint: int
    health_at_checkpoint: int
    current_ammo: int
    current_total_ammo: int


class UpdateGameStateRequest(BaseModel):
    game_save_id: int
    distance: int
    health: int
    ammo: int
    total_ammo: int
    kills: int
    play_time: float


class CompleteGameRequest(BaseModel):
    player_id: int
    game_save_id: int
    total_time: float
    total_kills: int


class GameController:
    def __init__(self):
        self.business = GameBusiness()

    def ActionGameRegisterPost(self, request: Request, body: RegisterPlayerRequest):
        """
        注册玩家
        POST /api/game/register
        请求体: { player_name: "玩家名称" }
        """
        result = self.business.register_player(body.player_name)
        return result

    def ActionGameNewgamePost(self, request: Request, player_id: int = Query(..., ge=1)):
        """
        开始新游戏
        POST /api/game/newgame
        参数: player_id - 玩家ID
        """
        result = self.business.start_new_game(player_id)
        return result

    def ActionGameSaveGet(self, request: Request, player_id: int = Query(..., ge=1)):
        """
        获取玩家活跃存档
        GET /api/game/save/get
        参数: player_id - 玩家ID
        """
        result = self.business.get_active_save(player_id)
        return result

    def ActionGameCheckpointPost(self, request: Request, body: SaveCheckpointRequest):
        """
        保存检查点
        POST /api/game/checkpoint
        请求体: 检查点数据
        """
        result = self.business.save_checkpoint(
            body.player_id,
            body.game_save_id,
            body.checkpoint_distance,
            body.arrival_time,
            body.kills_at_checkpoint,
            body.health_at_checkpoint,
            body.current_ammo,
            body.current_total_ammo
        )
        return result

    def ActionGameStatePost(self, request: Request, body: UpdateGameStateRequest):
        """
        更新游戏状态
        POST /api/game/state
        请求体: 游戏状态数据
        """
        result = self.business.update_game_state(
            body.game_save_id,
            body.distance,
            body.health,
            body.ammo,
            body.total_ammo,
            body.kills,
            body.play_time
        )
        return result

    def ActionGameCompletePost(self, request: Request, body: CompleteGameRequest):
        """
        完成游戏并提交成绩
        POST /api/game/complete
        请求体: 游戏完成数据
        """
        result = self.business.complete_game(
            body.player_id,
            body.game_save_id,
            body.total_time,
            body.total_kills
        )
        return result

    def ActionGameLeaderboardGet(self, request: Request, page: int = Query(1, ge=1),
                                  page_size: int = Query(20, ge=1, le=100)):
        """
        获取排行榜
        GET /api/game/leaderboard/get
        参数: page - 页码, page_size - 每页数量
        """
        result = self.business.get_leaderboard(page, page_size)
        return result

    def ActionGameCheckpointsGet(self, request: Request, player_id: int = Query(..., ge=1)):
        """
        获取玩家检查点记录
        GET /api/game/checkpoints/get
        参数: player_id - 玩家ID
        """
        result = self.business.get_player_checkpoints(player_id)
        return result
