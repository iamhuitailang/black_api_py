from typing import Optional
from fastapi import Request, Header, Query


class DanzhuScoreController:
    def __init__(self):
        from app.business.danzhu import DanzhuScoreBusiness
        self.score_business = DanzhuScoreBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def ActionDanzhuScoreTopGet(self, request: Request,
                                  level_id: Optional[int] = Query(None, description="关卡ID"),
                                  page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量")):
        """
        获取排行榜接口
        GET /api/danzhu/score/top/get
        获取分数排行榜
        """
        return self.score_business.get_top_scores(level_id, page, page_size)

    def ActionDanzhuScoreUserGet(self, request: Request,
                                  page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取用户分数历史接口
        GET /api/danzhu/score/user/get
        获取当前用户的分数历史
        """
        from app.business.danzhu import DanzhuUserBusiness
        user_business = DanzhuUserBusiness()

        token = self._get_token_from_header(request, authorization)
        user = user_business.verify_token(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.score_business.get_user_scores(user.get('id'), page, page_size)

    def ActionDanzhuScoreHighGet(self, request: Request,
                                  user_id: Optional[int] = Query(None, description="用户ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取用户最高分接口
        GET /api/danzhu/score/high/get
        获取用户的最高分
        """
        from app.business.danzhu import DanzhuUserBusiness
        user_business = DanzhuUserBusiness()

        if not user_id:
            token = self._get_token_from_header(request, authorization)
            user = user_business.verify_token(token)
            if not user:
                return {
                    'code': 1,
                    'msg': '请先登录',
                    'data': None
                }
            user_id = user.get('id')

        return self.score_business.get_user_high_score(user_id)

    def ActionDanzhuScoreRankGet(self, request: Request,
                                  level_id: Optional[int] = Query(None, description="关卡ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取用户排名接口
        GET /api/danzhu/score/rank/get
        获取当前用户的排名
        """
        from app.business.danzhu import DanzhuUserBusiness
        user_business = DanzhuUserBusiness()

        token = self._get_token_from_header(request, authorization)
        user = user_business.verify_token(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.score_business.get_user_rank(user.get('id'), level_id)
