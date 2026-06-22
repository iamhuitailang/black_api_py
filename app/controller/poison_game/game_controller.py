from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.poison_game import PoisonGameBusiness


class GameRecordSubmitRequest(BaseModel):
    player_id: str
    level: int
    completion_time: float
    purification_found: int
    purification_total: int
    death_count: int = 0


class PoisonGameController:
    def __init__(self):
        self.business = PoisonGameBusiness()

    def ActionPoisonGameProgressGet(self, request: Request, player_id: str = Query(...)):
        """
        获取玩家关卡解锁进度
        GET /api/poison_game/progress/get
        参数: player_id - 玩家ID
        """
        return self.business.get_progress(player_id)

    def ActionPoisonGameRecordsGet(self, request: Request,
                                   player_id: str = Query(...),
                                   level: Optional[int] = Query(None, ge=1, le=12)):
        """
        获取玩家通关记录列表
        GET /api/poison_game/records/get
        参数: player_id - 玩家ID, level - 可选关卡号
        """
        return self.business.get_records(player_id, level)

    def ActionPoisonGameRecordsBestget(self, request: Request,
                                       player_id: str = Query(...),
                                       level: int = Query(..., ge=1, le=12)):
        """
        获取指定关卡的最佳记录
        GET /api/poison_game/records/bestget
        参数: player_id - 玩家ID, level - 关卡号
        """
        return self.business.get_best_record(player_id, level)

    def ActionPoisonGameRecordsSet(self, request: Request, body: GameRecordSubmitRequest):
        """
        提交通关记录
        POST /api/poison_game/records/set
        请求体: { player_id, level, completion_time, purification_found, purification_total, death_count }
        """
        return self.business.submit_record(
            player_id=body.player_id,
            level=body.level,
            completion_time=body.completion_time,
            purification_found=body.purification_found,
            purification_total=body.purification_total,
            death_count=body.death_count
        )

    def ActionPoisonGameRecordsGetlist(self, request: Request,
                                       page: int = Query(1, ge=1),
                                       page_size: int = Query(20, ge=1, le=100)):
        """
        获取所有通关记录（分页）
        GET /api/poison_game/records/getlist
        参数: page - 页码, page_size - 每页数量
        """
        return self.business.get_all_records(page, page_size)
