from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class ChouchouHighScoreController:
    def __init__(self):
        from app.business.chouchou_model import HighScoreBusiness, UserBusiness
        self.high_score_business = HighScoreBusiness()
        self.user_business = UserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization:
            if authorization.startswith('Bearer '):
                return authorization[7:]
            return authorization

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionChouchouHighscoreMyGet(self, request: Request,
                                      score_type: Optional[str] = Query(None, description="积分类型"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取我的最佳成绩接口
        GET /api/chouchou_model/highscore/my/get
        获取当前用户的最佳成绩
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.high_score_business.get_user_best(
            user_id=user.get('id'),
            score_type=score_type
        )

    def ActionChouchouHighscoreLeaderboardGet(self, request: Request,
                                                score_type: str = Query(..., description="积分类型"),
                                                limit: int = Query(10, description="数量"),
                                                authorization: Optional[str] = Header(None)):
        """
        获取排行榜接口
        GET /api/chouchou_model/highscore/leaderboard/get
        获取指定类型的排行榜
        """
        return self.high_score_business.get_leaderboard(
            score_type=score_type,
            limit=limit
        )

    def ActionChouchouHighscoreAllLeaderboardsGet(self, request: Request,
                                                    limit: int = Query(10, description="数量"),
                                                    authorization: Optional[str] = Header(None)):
        """
        获取所有排行榜接口
        GET /api/chouchou_model/highscore/all/leaderboards/get
        获取所有类型的排行榜
        """
        return self.high_score_business.get_all_leaderboards(limit=limit)

    def ActionChouchouHighscoreTypesGet(self, request: Request,
                                         authorization: Optional[str] = Header(None)):
        """
        获取积分类型接口
        GET /api/chouchou_model/highscore/types/get
        获取所有积分类型说明
        """
        return self.high_score_business.get_score_types()
