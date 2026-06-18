from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.game import GameBusiness


class WaveRecordRequest(BaseModel):
    player_name: Optional[str] = 'Anonymous'
    wave: int
    score: int
    kills: int
    elite_kills: Optional[int] = 0
    boss_kills: Optional[int] = 0
    damage_dealt: Optional[int] = 0
    arrows_shot: Optional[int] = 0
    crystals_collected: Optional[int] = 0
    survival_time: Optional[int] = 0
    is_victory: Optional[bool] = False


class GameController:
    def __init__(self):
        self.business = GameBusiness()

    def ActionGameSaveRecordPost(self, request: Request, body: WaveRecordRequest):
        """
        保存游戏波次记录
        POST /api/game/save/record
        """
        result = self.business.save_wave_record(
            player_name=body.player_name,
            wave=body.wave,
            score=body.score,
            kills=body.kills,
            elite_kills=body.elite_kills,
            boss_kills=body.boss_kills,
            damage_dealt=body.damage_dealt,
            arrows_shot=body.arrows_shot,
            crystals_collected=body.crystals_collected,
            survival_time=body.survival_time,
            is_victory=body.is_victory
        )
        return result

    def ActionGameGetRecord(self, request: Request, id: int = Query(..., ge=1)):
        """
        获取单条记录
        GET /api/game/get/record
        """
        result = self.business.get_record(id)
        return result

    def ActionGameGetLatest(self, request: Request):
        """
        获取最新记录
        GET /api/game/get/latest
        """
        result = self.business.get_latest_record()
        return result

    def ActionGameGetTopScores(self, request: Request, limit: int = Query(10, ge=1, le=100)):
        """
        获取排行榜
        GET /api/game/get/top/scores
        """
        result = self.business.get_top_scores(limit)
        return result

    def ActionGameGetHighestWave(self, request: Request):
        """
        获取最高波数
        GET /api/game/get/highest/wave
        """
        result = self.business.get_highest_wave()
        return result

    def ActionGameGetRecordsGetlist(self, request: Request, page: int = Query(1, ge=1),
                                     page_size: int = Query(10, ge=1, le=100)):
        """
        获取记录列表（分页）
        GET /api/game/get/records/getlist
        """
        result = self.business.get_records_paginated(page, page_size)
        return result

    def ActionGameGetStats(self, request: Request):
        """
        获取统计摘要
        GET /api/game/get/stats
        """
        result = self.business.get_stats_summary()
        return result

    def ActionGameDeleteRecord(self, request: Request, id: int = Query(..., ge=1)):
        """
        删除记录
        DELETE /api/game/delete/record
        """
        result = self.business.delete_record(id)
        return result
