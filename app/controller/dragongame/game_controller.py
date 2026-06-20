from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.dragongame import DragonGameBusiness


class StartGameRequest(BaseModel):
    player_name: Optional[str] = 'Player'


class SaveProgressRequest(BaseModel):
    record_id: int
    wave_reached: int
    enemies_killed: int
    score: int


class FinishGameRequest(BaseModel):
    record_id: int
    wave_reached: int
    enemies_killed: int
    score: int


class CollectEssenceRequest(BaseModel):
    status_id: int
    amount: Optional[int] = 1


class UpgradeFlameRequest(BaseModel):
    status_id: int
    essence_cost: Optional[int] = 1


class DragonGameController:
    def __init__(self):
        self.business = DragonGameBusiness()

    def ActionDragongameStart(self, request: Request, body: StartGameRequest):
        """
        开始新游戏
        POST /api/dragongame/start
        请求体: { player_name: "玩家名" }
        """
        return self.business.start_new_game(body.player_name or 'Player')

    def ActionDragongameSaveprogress(self, request: Request, body: SaveProgressRequest):
        """
        保存游戏进度
        POST /api/dragongame/saveprogress
        请求体: { record_id, wave_reached, enemies_killed, score }
        """
        return self.business.save_progress(
            body.record_id,
            body.wave_reached,
            body.enemies_killed,
            body.score
        )

    def ActionDragongameFinish(self, request: Request, body: FinishGameRequest):
        """
        结束游戏并保存最终成绩
        POST /api/dragongame/finish
        请求体: { record_id, wave_reached, enemies_killed, score }
        """
        return self.business.finish_game(
            body.record_id,
            body.wave_reached,
            body.enemies_killed,
            body.score
        )

    def ActionDragongameGetrecord(self, request: Request, id: int = Query(..., ge=1)):
        """
        获取游戏记录
        GET /api/dragongame/getrecord
        参数: id - 记录ID
        """
        return self.business.get_record(id)

    def ActionDragongameGetplayerrecords(self, request: Request, player_name: str = Query(...)):
        """
        获取玩家历史记录
        GET /api/dragongame/getplayerrecords
        参数: player_name - 玩家名
        """
        return self.business.get_player_records(player_name)

    def ActionDragongameGetleaderboard(self, request: Request, limit: int = Query(10, ge=1, le=100)):
        """
        获取排行榜
        GET /api/dragongame/getleaderboard
        参数: limit - 数量限制
        """
        return self.business.get_leaderboard(limit)

    def ActionDragongameCollectessence(self, request: Request, body: CollectEssenceRequest):
        """
        收集火焰精华
        POST /api/dragongame/collectessence
        请求体: { status_id, amount }
        """
        return self.business.collect_essence(body.status_id, body.amount or 1)

    def ActionDragongameUpgradeflame(self, request: Request, body: UpgradeFlameRequest):
        """
        升级龙焰
        POST /api/dragongame/upgradeflame
        请求体: { status_id, essence_cost }
        """
        return self.business.upgrade_flame(body.status_id, body.essence_cost or 1)

    def ActionDragongameGetdragonstatus(self, request: Request, id: int = Query(..., ge=1)):
        """
        获取龙的状态
        GET /api/dragongame/getdragonstatus
        参数: id - 状态ID
        """
        return self.business.get_dragon_status(id)

    def ActionDragongameGetrecords(self, request: Request, page: int = Query(1, ge=1),
                                   page_size: int = Query(10, ge=1, le=100)):
        """
        获取所有游戏记录（分页）
        GET /api/dragongame/getrecords
        参数: page - 页码, page_size - 每页数量
        """
        return self.business.get_all_records(page, page_size)

    def ActionDragongameDeleterecord(self, request: Request, id: int = Query(..., ge=1)):
        """
        删除游戏记录
        DELETE /api/dragongame/deleterecord
        参数: id - 记录ID
        """
        return self.business.delete_record(id)
