from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.antgame import AntGameBusiness


class NewGameRequest(BaseModel):
    save_name: Optional[str] = "新存档"


class DigRequest(BaseModel):
    save_id: int
    grid_x: int
    grid_y: int


class BuildRoomRequest(BaseModel):
    save_id: int
    grid_x: int
    grid_y: int
    room_type: str


class SpawnAntRequest(BaseModel):
    save_id: int
    ant_type: str


class AntGameController:
    def __init__(self):
        self.business = AntGameBusiness()

    def ActionAntgameSavolistGet(self, request: Request):
        """
        获取存档列表
        GET /api/antgame/savolist/get
        """
        result = self.business.get_save_list()
        return result

    def ActionAntgameStateGet(self, request: Request, save_id: int = Query(..., ge=1)):
        """
        获取游戏状态
        GET /api/antgame/state/get
        参数: save_id - 存档ID
        """
        result = self.business.get_game_state(save_id)
        return result

    def ActionAntgameNewPost(self, request: Request, body: NewGameRequest):
        """
        创建新游戏
        POST /api/antgame/new
        请求体: { save_name: "存档名称" }
        """
        result = self.business.create_new_game(body.save_name)
        return result

    def ActionAntgameTickPost(self, request: Request, save_id: int = Query(..., ge=1)):
        """
        推进游戏一个时间单位
        POST /api/antgame/tick
        参数: save_id - 存档ID
        """
        result = self.business.tick(save_id)
        return result

    def ActionAntgameDigPost(self, request: Request, body: DigRequest):
        """
        挖掘隧道
        POST /api/antgame/dig
        请求体: { save_id, grid_x, grid_y }
        """
        result = self.business.dig_tunnel(body.save_id, body.grid_x, body.grid_y)
        return result

    def ActionAntgameBuildPost(self, request: Request, body: BuildRoomRequest):
        """
        建造房间
        POST /api/antgame/build
        请求体: { save_id, grid_x, grid_y, room_type }
        """
        result = self.business.build_room(body.save_id, body.grid_x, body.grid_y, body.room_type)
        return result

    def ActionAntgameSpawnPost(self, request: Request, body: SpawnAntRequest):
        """
        孵化蚂蚁
        POST /api/antgame/spawn
        请求体: { save_id, ant_type }
        """
        result = self.business.spawn_ant(body.save_id, body.ant_type)
        return result

    def ActionAntgamePausePost(self, request: Request, save_id: int = Query(..., ge=1)):
        """
        切换暂停状态
        POST /api/antgame/pause
        参数: save_id - 存档ID
        """
        result = self.business.toggle_pause(save_id)
        return result

    def ActionAntgameDelete(self, request: Request, save_id: int = Query(..., ge=1)):
        """
        删除存档
        DELETE /api/antgame/delete
        参数: save_id - 存档ID
        """
        result = self.business.delete_save(save_id)
        return result
