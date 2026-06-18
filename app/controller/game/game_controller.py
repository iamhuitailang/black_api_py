from typing import Optional
from fastapi import Query, Request
from pydantic import BaseModel
from app.business.game import GameStateBusiness


class GameSaveRequest(BaseModel):
    player_name: str
    game_data: dict
    id: Optional[int] = None


class GameController:
    def __init__(self):
        self.business = GameStateBusiness()

    def ActionGameGet(self, request: Request, id: Optional[int] = Query(None), 
                        player_name: Optional[str] = Query(None)):
        """
        获取游戏存档
        GET /api/game/get
        参数: id (可选) - 指定获取某条记录, player_name (可选) - 按玩家名获取
        """
        result = self.business.get_game_state(id, player_name)
        return result

    def ActionGameGetlist(self, request: Request, page: int = Query(1, ge=1), 
                          page_size: int = Query(10, ge=1, le=100)):
        """
        获取游戏存档列表（分页）
        GET /api/game/getlist
        参数: page - 页码, page_size - 每页数量
        """
        result = self.business.get_all_saves(page, page_size)
        return result

    def ActionGameSavePost(self, request: Request, body: GameSaveRequest):
        """
        保存游戏
        POST /api/game/save
        请求体: { player_name: "玩家名", game_data: {...}, id: 可选 }
        """
        result = self.business.save_game(body.player_name, body.game_data, body.id)
        return result

    def ActionGameDelete(self, request: Request, id: int = Query(..., ge=1)):
        """
        删除游戏存档
        DELETE /api/game/delete
        参数: id - 要删除的记录ID
        """
        result = self.business.delete_save(id)
        return result
