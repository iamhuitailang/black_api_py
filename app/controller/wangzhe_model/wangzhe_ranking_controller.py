from typing import Optional
from fastapi import Request, Header, Query


class WangzheRankingController:
    def __init__(self):
        from app.business.wangzhe_model.ranking_business import WangzheRankingBusiness
        self.ranking_business = WangzheRankingBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.wangzhe_model.user_business import WangzheUserBusiness
        user_business = WangzheUserBusiness()
        return user_business.verify_token(token)

    def ActionWangzheRankingListGet(self, request: Request, ranking_type: str = Query('all', description="排行类型"),
                                     page: int = Query(1, description="页码"),
                                     page_size: int = Query(100, description="每页数量")):
        """
        获取排行榜接口
        GET /api/wangzhe/ranking/list/get
        获取排行榜数据
        """
        return self.ranking_business.get_ranking_list(ranking_type, page, page_size)

    def ActionWangzheRankingMyGet(self, request: Request, ranking_type: str = Query('all', description="排行类型"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取我的排名接口
        GET /api/wangzhe/ranking/my/get
        获取当前用户的排名信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.ranking_business.get_user_ranking(user.get('id'), ranking_type)

    def ActionWangzheRankingTiersGet(self, request: Request):
        """
        获取段位列表接口
        GET /api/wangzhe/ranking/tiers/get
        获取所有段位信息
        """
        return self.ranking_business.get_all_tiers()
