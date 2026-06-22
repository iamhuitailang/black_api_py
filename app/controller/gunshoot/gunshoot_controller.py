from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.gunshoot import GunShootBusiness


class LevelStatsSubmitRequest(BaseModel):
    level_id: int = 1
    cleared: bool
    remaining_hp: int
    total_time: float
    dual_gun_shots: int
    dual_gun_hits: int
    single_gun_shots: int
    single_gun_hits: int
    stationary_time: float
    enemies_killed: int
    total_enemies: int
    damage_dealt: int
    damage_taken: int
    reload_count: int


class GunShootController:
    def __init__(self):
        self.business = GunShootBusiness()

    def ActionGunshootStatsSet(self, request: Request, body: LevelStatsSubmitRequest):
        """
        提交关卡统计数据
        POST /api/gunshoot/stats/set
        """
        stats_dict = body.model_dump()
        result = self.business.submit_level_stats(stats_dict)
        return result

    def ActionGunshootStatsGet(self, request: Request, id: Optional[int] = Query(None)):
        """
        获取关卡统计记录
        GET /api/gunshoot/stats/get
        参数: id (可选) - 指定获取某条记录
        """
        result = self.business.get_level_stats(id)
        return result

    def ActionGunshootStatsGetlist(self, request: Request,
                                    level_id: int = Query(1, ge=1),
                                    page: int = Query(1, ge=1),
                                    page_size: int = Query(20, ge=1, le=100)):
        """
        获取关卡统计记录列表（分页）
        GET /api/gunshoot/stats/getlist
        """
        result = self.business.get_level_records(level_id, page, page_size)
        return result

    def ActionGunshootStatsBest(self, request: Request, level_id: int = Query(1, ge=1)):
        """
        获取指定关卡最佳通关记录
        GET /api/gunshoot/stats/best
        """
        result = self.business.get_best_record(level_id)
        return result
