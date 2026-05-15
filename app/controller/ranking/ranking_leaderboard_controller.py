from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateLeaderboardRequest(BaseModel):
    game_type: str = Field(..., description="游戏类型")
    name: str = Field(..., description="排行榜名称")
    period: str = Field(..., description="周期类型: daily/weekly/monthly/all")
    reset_time: Optional[str] = Field('00:00:00', description="重置时间")
    sort_order: Optional[str] = Field('desc', description="排序方式: desc/asc")


class UpdateLeaderboardRequest(BaseModel):
    name: Optional[str] = Field(None, description="排行榜名称")
    reset_time: Optional[str] = Field(None, description="重置时间")
    sort_order: Optional[str] = Field(None, description="排序方式: desc/asc")


class RankingLeaderboardController:
    def __init__(self):
        from app.business.ranking import LeaderboardBusiness
        self.leaderboard_business = LeaderboardBusiness()

    def ActionRankingLeaderboardListGet(self, request: Request,
                                        game_type: Optional[str] = Query(None, description="游戏类型"),
                                        page: int = Query(1, description="页码"),
                                        page_size: int = Query(10, description="每页数量")):
        """
        获取排行榜列表接口
        GET /api/ranking/leaderboard/list/get
        根据游戏类型获取排行榜列表
        """
        if game_type:
            return self.leaderboard_business.get_leaderboards_by_game(game_type)
        return self.leaderboard_business.get_leaderboard_list(page, page_size)

    def ActionRankingLeaderboardCreatePost(self, request: Request, body: CreateLeaderboardRequest):
        """
        创建排行榜接口
        POST /api/ranking/leaderboard/create
        创建新的排行榜
        """
        return self.leaderboard_business.create_leaderboard(
            game_type=body.game_type,
            name=body.name,
            period=body.period,
            reset_time=body.reset_time,
            sort_order=body.sort_order
        )

    def ActionRankingLeaderboardUpdatePost(self, request: Request, record_id: int = Query(..., description="排行榜ID"),
                                           body: UpdateLeaderboardRequest = None):
        """
        更新排行榜接口
        POST /api/ranking/leaderboard/update
        更新排行榜配置
        """
        data = {k: v for k, v in body.dict().items() if v is not None}
        return self.leaderboard_business.update_leaderboard(record_id, data)

    def ActionRankingLeaderboardDeletePost(self, request: Request, record_id: int = Query(..., description="排行榜ID")):
        """
        删除排行榜接口
        POST /api/ranking/leaderboard/delete
        删除指定排行榜
        """
        return self.leaderboard_business.delete_leaderboard(record_id)
