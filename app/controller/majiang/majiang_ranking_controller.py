from typing import Optional
from fastapi import Request, Query, Header
from app.business.majiang import MajiangRankingBusiness
from app.business.majiang import MajiangUserBusiness


class MajiangRankingController:
    def __init__(self):
        self.ranking_business = MajiangRankingBusiness()
        self.user_business = MajiangUserBusiness()

    def _verify_user(self, authorization: str) -> Optional[dict]:
        if not authorization or not authorization.startswith('Bearer '):
            return None
        token = authorization.replace('Bearer ', '')
        result = self.user_business.verify_token(token)
        if result.get('code') == 0:
            return result.get('data')
        return None

    def ActionMajiangRankingGet(self, request: Request,
                                 ranking_type: int = Query(4, description='排行类型：1日榜 2周榜 3月榜 4总榜'),
                                 period: Optional[str] = Query(None, description='周期'),
                                 limit: int = Query(100, description='数量')):
        return self.ranking_business.get_ranking(ranking_type, period, limit)

    def ActionMajiangRankingUserGet(self, request: Request,
                                     authorization: Optional[str] = Header(None),
                                     ranking_type: int = Query(4, description='排行类型')):
        user = self._verify_user(authorization)
        if not user:
            return {
                'code': 1,
                'msg': '用户未登录',
                'data': None
            }

        return self.ranking_business.get_user_ranking(user.get('id'), ranking_type)

    def ActionMajiangRankingAllGet(self, request: Request,
                                    authorization: Optional[str] = Header(None)):
        user_id = None
        if authorization and authorization.startswith('Bearer '):
            token = authorization.replace('Bearer ', '')
            result = self.user_business.verify_token(token)
            if result.get('code') == 0:
                user_id = result.get('data', {}).get('id')

        return self.ranking_business.get_all_rankings(user_id)

    def ActionMajiangRankingRefreshPost(self, request: Request,
                                         ranking_type: int = Query(4, description='排行类型'),
                                         authorization: Optional[str] = Header(None)):
        if not authorization or not authorization.startswith('Bearer '):
            return {
                'code': 1,
                'msg': '管理员未登录或权限不足',
                'data': None
            }

        return self.ranking_business.refresh_ranking(ranking_type)
