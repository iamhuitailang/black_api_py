from typing import Optional
from fastapi import Request, Query
from pydantic import BaseModel, Field
from app.business.fishing import FishingBusiness


class FishingSubmitRequest(BaseModel):
    player_name: str = Field(default='Anonymous', max_length=32)
    score: int = Field(ge=0)
    fish_count: int = Field(ge=0)
    biggest_fish: float = Field(ge=0.0)


class FishingController:
    def __init__(self):
        self.business = FishingBusiness()

    def ActionFishingSubmitPost(self, request: Request, body: FishingSubmitRequest):
        """
        提交钓鱼成绩
        POST /api/fishing/submit
        请求体: { player_name, score, fish_count, biggest_fish }
        """
        result = self.business.submit_score(
            body.player_name,
            body.score,
            body.fish_count,
            body.biggest_fish
        )
        return result

    def ActionFishingLeaderboard(self, request: Request,
                                limit: Optional[int] = Query(None, ge=1, le=200),
                                page: int = Query(1, ge=1),
                                page_size: int = Query(20, ge=1, le=100)):
        """
        获取钓鱼排行榜
        GET /api/fishing/leaderboard
        参数: limit(可选) - 返回前N条, page - 页码, page_size - 每页数量
        """
        result = self.business.get_leaderboard(limit, page, page_size)
        return result
