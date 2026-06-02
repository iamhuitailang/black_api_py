from typing import Optional
from fastapi import Request, Query


class DafuwengRankController:
    def __init__(self):
        from app.business.dafuweng.rank_business import RankBusiness
        self.rank_business = RankBusiness()

    def ActionDafuwengRankCoinsGet(self, request: Request,
                                    page: int = Query(1, ge=1, description="页码"),
                                    page_size: int = Query(10, ge=1, le=100, description="每页数量")):
        return self.rank_business.get_rank_list(page=page, page_size=page_size)

    def ActionDafuwengRankWinsGet(self, request: Request,
                                   page: int = Query(1, ge=1, description="页码"),
                                   page_size: int = Query(10, ge=1, le=100, description="每页数量")):
        return self.rank_business.get_win_rank_list(page=page, page_size=page_size)

    def ActionDafuwengRankGameGet(self, request: Request, game_id: int = Query(..., description="游戏ID")):
        return self.rank_business.get_game_rank_list(game_id=game_id)
