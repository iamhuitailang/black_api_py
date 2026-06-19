from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field
from app.business.hover_race import RaceBusiness


class LapRecordRequest(BaseModel):
    player_name: str = Field(..., description="玩家名称")
    lap_time: float = Field(..., description="圈速时间（秒）")
    track_name: Optional[str] = Field(default='Neon Circuit', description="赛道名称")
    lap_number: Optional[int] = Field(default=1, description="圈数")


class RaceRecordRequest(BaseModel):
    player_name: str = Field(..., description="玩家名称")
    total_time: float = Field(..., description="总时间（秒）")
    best_lap: float = Field(..., description="最佳圈速（秒）")
    position: Optional[int] = Field(default=1, description="名次")
    total_laps: Optional[int] = Field(default=3, description="总圈数")
    track_name: Optional[str] = Field(default='Neon Circuit', description="赛道名称")
    opponents: Optional[int] = Field(default=3, description="对手数量")


class HoverRaceController:
    def __init__(self):
        self.race_business = RaceBusiness()

    def ActionHoverRaceLapRecordPost(self, request: Request, body: LapRecordRequest):
        """
        保存圈速记录
        POST /api/hover_race/lap_record
        保存单圈最快成绩
        """
        return self.race_business.save_lap_record(
            player_name=body.player_name,
            lap_time=body.lap_time,
            track_name=body.track_name,
            lap_number=body.lap_number
        )

    def ActionHoverRaceLapTopGet(self, request: Request,
                                  limit: int = Query(default=10, ge=1, le=100, description="返回数量"),
                                  track_name: Optional[str] = Query(default=None, description="赛道名称")):
        """
        获取圈速排行榜
        GET /api/hover_race/lap/top/get
        返回最快圈速排行榜
        """
        return self.race_business.get_top_lap_records(limit=limit, track_name=track_name)

    def ActionHoverRaceRecordPost(self, request: Request, body: RaceRecordRequest):
        """
        保存比赛记录
        POST /api/hover_race/record
        保存完整比赛结果
        """
        return self.race_business.save_race_record(
            player_name=body.player_name,
            total_time=body.total_time,
            best_lap=body.best_lap,
            position=body.position,
            total_laps=body.total_laps,
            track_name=body.track_name,
            opponents=body.opponents
        )

    def ActionHoverRaceRaceTopGet(self, request: Request,
                                   limit: int = Query(default=10, ge=1, le=100, description="返回数量"),
                                   track_name: Optional[str] = Query(default=None, description="赛道名称")):
        """
        获取比赛排行榜
        GET /api/hover_race/race/top/get
        返回总时间最快的比赛排行榜
        """
        return self.race_business.get_top_race_records(limit=limit, track_name=track_name)

    def ActionHoverRacePlayerBestGet(self, request: Request,
                                      player_name: str = Query(..., description="玩家名称"),
                                      track_name: Optional[str] = Query(default=None, description="赛道名称")):
        """
        获取玩家最佳圈速
        GET /api/hover_race/player/best/get
        返回指定玩家的最佳单圈成绩
        """
        return self.race_business.get_player_best_lap(
            player_name=player_name,
            track_name=track_name
        )

    def ActionHoverRacePlayerHistoryGet(self, request: Request,
                                         player_name: str = Query(..., description="玩家名称"),
                                         limit: int = Query(default=10, ge=1, le=100, description="返回数量")):
        """
        获取玩家比赛历史
        GET /api/hover_race/player/history/get
        返回指定玩家的比赛历史记录
        """
        return self.race_business.get_player_race_history(
            player_name=player_name,
            limit=limit
        )
