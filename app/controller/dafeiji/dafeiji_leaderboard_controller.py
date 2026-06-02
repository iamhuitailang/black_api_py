from typing import Optional
from fastapi import Request, Query


class DafeijiLeaderboardController:
    def __init__(self):
        from app.business.dafeiji.leaderboard_business import DafeijiLeaderboardBusiness
        self.leaderboard_business = DafeijiLeaderboardBusiness()

    def ActionDafeijiLeaderboardTopGet(self, request: Request,
                                        limit: int = Query(10, ge=1, le=100, description="数量")):
        return self.leaderboard_business.get_top(limit=limit)

    def ActionDafeijiLeaderboardUserBestGet(self, request: Request,
                                             user_id: int = Query(..., description="用户ID")):
        return self.leaderboard_business.get_user_best(user_id=user_id)

    def ActionDafeijiLeaderboardUserRankGet(self, request: Request,
                                             user_id: int = Query(..., description="用户ID")):
        return self.leaderboard_business.get_user_rank(user_id=user_id)

    def ActionDafeijiLeaderboardUserHistoryGet(self, request: Request,
                                                user_id: int = Query(..., description="用户ID"),
                                                limit: int = Query(10, ge=1, le=100, description="数量")):
        return self.leaderboard_business.get_user_history(
            user_id=user_id,
            limit=limit
        )

    def ActionDafeijiLeaderboardAllGet(self, request: Request,
                                        page: int = Query(1, ge=1, description="页码"),
                                        page_size: int = Query(10, ge=1, le=100, description="每页数量")):
        return self.leaderboard_business.get_all(
            page=page,
            page_size=page_size
        )
