from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field
from app.business.skate import TrackBusiness, ScoreBusiness


class TerrainSegment(BaseModel):
    type: str = Field(..., description="地形类型: flat/downhill/uphill/curve")
    start: int = Field(..., description="起始位置")
    end: int = Field(..., description="结束位置")
    speed: int = Field(..., description="该段速度")
    direction: Optional[str] = Field(default=None, description="弯道方向: left/right")


class Obstacle(BaseModel):
    type: str = Field(..., description="障碍物类型: cone/pedestrian/skater")
    position: int = Field(..., description="位置")
    lane: int = Field(..., description="赛道车道: 0/1/2")


class Rail(BaseModel):
    start: int = Field(..., description="滑轨起始位置")
    end: int = Field(..., description="滑轨结束位置")
    lane: int = Field(..., description="所在车道")
    height: int = Field(default=30, description="滑轨高度")


class TrackAddRequest(BaseModel):
    name: str = Field(..., description="赛道名称")
    description: str = Field(default='', description="赛道描述")
    length: int = Field(..., ge=1000, description="赛道长度")
    difficulty: int = Field(default=1, ge=1, le=5, description="难度等级")
    terrain_data: List[TerrainSegment] = Field(..., description="地形数据列表")
    obstacle_data: List[Obstacle] = Field(..., description="障碍物数据列表")
    rail_data: Optional[List[Rail]] = Field(default=[], description="滑轨数据列表")


class ScoreAddRequest(BaseModel):
    player_name: str = Field(default='Player', description="玩家名称")
    track_id: int = Field(..., ge=1, description="赛道ID")
    score: int = Field(default=0, description="总得分")
    trick_score: int = Field(default=0, description="技巧得分")
    time_used: float = Field(default=0, description="用时（秒）")
    crash_count: int = Field(default=0, description="摔出次数")


class SkateController:
    def __init__(self):
        self.track_business = TrackBusiness()
        self.score_business = ScoreBusiness()

    def ActionSkateTrackListGet(self, request: Request):
        """
        获取赛道列表接口
        GET /api/skate/track/list/get
        返回所有赛道的基本信息列表
        """
        return self.track_business.get_tracks()

    def ActionSkateTrackDetailGet(self, request: Request, id: int = Query(..., ge=1, description="赛道ID")):
        """
        获取赛道详情接口
        GET /api/skate/track/detail/get
        返回赛道完整数据，包括地形、障碍物、滑轨配置
        """
        return self.track_business.get_track_detail(id)

    def ActionSkateTrackAddPost(self, request: Request, body: TrackAddRequest):
        """
        添加赛道接口
        POST /api/skate/track/add
        动态添加新赛道
        """
        terrain_data = []
        for seg in body.terrain_data:
            item = {
                'type': seg.type,
                'start': seg.start,
                'end': seg.end,
                'speed': seg.speed
            }
            if seg.direction:
                item['direction'] = seg.direction
            terrain_data.append(item)

        obstacle_data = []
        for obs in body.obstacle_data:
            obstacle_data.append({
                'type': obs.type,
                'position': obs.position,
                'lane': obs.lane
            })

        rail_data = []
        if body.rail_data:
            for rail in body.rail_data:
                rail_data.append({
                    'start': rail.start,
                    'end': rail.end,
                    'lane': rail.lane,
                    'height': rail.height
                })

        return self.track_business.add_track(
            name=body.name,
            description=body.description,
            length=body.length,
            difficulty=body.difficulty,
            terrain_data=terrain_data,
            obstacle_data=obstacle_data,
            rail_data=rail_data
        )

    def ActionSkateTrackDelete(self, request: Request, id: int = Query(..., ge=1, description="赛道ID")):
        """
        删除赛道接口
        DELETE /api/skate/track/delete
        """
        return self.track_business.delete_track(id)

    def ActionSkateScoreListGet(self, request: Request,
                                track_id: Optional[int] = Query(default=None, ge=1, description="赛道ID，可选"),
                                limit: int = Query(default=50, ge=1, le=200, description="返回数量限制")):
        """
        获取得分列表接口
        GET /api/skate/score/list/get
        可按赛道筛选得分排行
        """
        return self.score_business.get_scores(track_id, limit)

    def ActionSkateScoreTopGet(self, request: Request,
                               track_id: Optional[int] = Query(default=None, ge=1, description="赛道ID，可选"),
                               limit: int = Query(default=10, ge=1, le=50, description="返回数量限制")):
        """
        获取最高分排行榜接口
        GET /api/skate/score/top/get
        返回指定数量的最高分记录
        """
        return self.score_business.get_top_scores(track_id, limit)

    def ActionSkateScoreAddPost(self, request: Request, body: ScoreAddRequest):
        """
        添加得分记录接口
        POST /api/skate/score/add
        游戏结束后提交得分
        """
        return self.score_business.add_score(
            player_name=body.player_name,
            track_id=body.track_id,
            score=body.score,
            trick_score=body.trick_score,
            time_used=body.time_used,
            crash_count=body.crash_count
        )

    def ActionSkateScoreDelete(self, request: Request, id: int = Query(..., ge=1, description="得分记录ID")):
        """
        删除得分记录接口
        DELETE /api/skate/score/delete
        """
        return self.score_business.delete_score(id)
