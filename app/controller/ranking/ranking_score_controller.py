from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class SubmitScoreRequest(BaseModel):
    game_type: str = Field(..., description="游戏类型")
    period: str = Field(..., description="周期类型: daily/weekly/monthly/all")
    score: int = Field(..., description="分数")


class RankingScoreController:
    def __init__(self):
        from app.business.ranking import ScoreBusiness, AuthBusiness
        self.score_business = ScoreBusiness()
        self.auth_business = AuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_client_ip(self, request: Request) -> str:
        x_forwarded_for = request.headers.get('x-forwarded-for')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.client.host if request.client else ''

    def ActionRankingScoreSubmitPost(self, request: Request, body: SubmitScoreRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        提交分数接口
        POST /api/ranking/score/submit
        用户完成游戏后提交分数
        """
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        ip_address = self._get_client_ip(request)
        return self.score_business.submit_score(
            user_id=user.get('id'),
            game_type=body.game_type,
            period=body.period,
            score=body.score,
            ip_address=ip_address
        )

    def ActionRankingScoreLeaderboardGet(self, request: Request,
                                          game_type: str = Query(..., description="游戏类型"),
                                          period: str = Query('all', description="周期类型"),
                                          limit: int = Query(100, description="返回数量")):
        """
        获取排行榜接口
        GET /api/ranking/score/leaderboard/get
        获取指定榜单的排名列表
        """
        return self.score_business.get_leaderboard(game_type, period, limit)

    def ActionRankingScoreUserRankGet(self, request: Request,
                                       game_type: str = Query(..., description="游戏类型"),
                                       period: str = Query('all', description="周期类型"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取用户排名接口
        GET /api/ranking/score/user/rank/get
        查询当前用户的排名和分数
        """
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.score_business.get_user_rank_and_score(user.get('id'), game_type, period)

    def ActionRankingScoreUserHistoryGet(self, request: Request,
                                          game_type: Optional[str] = Query(None, description="游戏类型"),
                                          limit: int = Query(20, description="返回数量"),
                                          authorization: Optional[str] = Header(None)):
        """
        获取用户历史记录接口
        GET /api/ranking/score/user/history/get
        获取用户历史分数记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.score_business.get_user_history(user.get('id'), game_type, limit)

    def ActionRankingScoreResetPost(self, request: Request,
                                     game_type: str = Query(..., description="游戏类型"),
                                     period: str = Query(..., description="周期类型")):
        """
        重置周期分数接口
        POST /api/ranking/score/reset
        重置指定周期的历史分数
        """
        return self.score_business.reset_period_scores(game_type, period)
