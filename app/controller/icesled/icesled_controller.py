from typing import Optional, List
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field
from app.business.icesled import IceSledBusiness


class StartRaceRequest(BaseModel):
    track_id: Optional[int] = Field(None, description="赛道模板ID，不传则随机")
    player_name: Optional[str] = Field("玩家", description="玩家名称")
    player_actions: Optional[List[dict]] = Field(None, description="玩家逐帧操作")
    auto_simulate: Optional[bool] = Field(True, description="是否自动模拟玩家操作")


class GenerateTrackRequest(BaseModel):
    difficulty: Optional[str] = Field("normal", description="难度: easy/normal/hard")


class IcesledController:
    def __init__(self):
        self.business = IceSledBusiness()

    def ActionIcesledTrackGet(self, request: Request, id: Optional[int] = Query(None)):
        """
        获取赛道信息
        GET /api/icesled/track/get
        参数: id (可选) - 赛道ID，不传则随机一条
        """
        return self.business.get_track(id)

    def ActionIcesledTrackGetlist(self, request: Request):
        """
        获取所有赛道列表
        GET /api/icesled/track/getlist
        """
        return self.business.get_track_list()

    def ActionIcesledTrackGenerate(self, request: Request, body: GenerateTrackRequest):
        """
        生成新赛道
        POST /api/icesled/track/generate
        请求体: { difficulty: "easy/normal/hard" }
        """
        return self.business.generate_new_track(body.difficulty or 'normal')

    def ActionIcesledRaceStart(self, request: Request, body: StartRaceRequest):
        """
        开始一场比赛
        POST /api/icesled/race/start
        请求体: {
            track_id: 可选赛道ID,
            player_name: 可选玩家名,
            player_actions: 可选玩家操作列表,
            auto_simulate: 是否自动模拟
        }
        返回完整比赛数据（含逐帧动画和排名）
        """
        return self.business.start_race(
            track_id=body.track_id,
            player_name=body.player_name or '玩家',
            player_actions=body.player_actions,
            auto_simulate=body.auto_simulate or True
        )

    def ActionIcesledRaceGethistory(self, request: Request,
                                     page: int = Query(1, ge=1),
                                     page_size: int = Query(20, ge=1, le=100)):
        """
        获取比赛历史记录（分页）
        GET /api/icesled/race/gethistory
        """
        return self.business.get_race_history(page, page_size)

    def ActionIcesledRaceGetdetail(self, request: Request, id: int = Query(..., ge=1)):
        """
        获取单场比赛的详细信息
        GET /api/icesled/race/getdetail
        参数: id - 比赛记录ID
        """
        return self.business.get_race_detail(id)

    def ActionIcesledPlayerGetstats(self, request: Request,
                                     player_name: Optional[str] = Query("玩家")):
        """
        获取玩家统计数据
        GET /api/icesled/player/getstats
        参数: player_name - 玩家名
        """
        return self.business.get_player_stats(player_name or '玩家')

    def ActionIcesledPlayerGetleaderboard(self, request: Request,
                                           limit: int = Query(10, ge=1, le=100)):
        """
        获取最快记录排行榜
        GET /api/icesled/player/getleaderboard
        """
        return self.business.get_leaderboard(limit)
