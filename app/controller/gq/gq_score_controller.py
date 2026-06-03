from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class SubmitScoreRequest(BaseModel):
    track_id: int = Field(..., description="曲目ID")
    score: int = Field(..., description="分数")
    max_combo: int = Field(..., description="最大连击")
    accuracy: float = Field(..., description="准确率")
    stars: int = Field(..., description="星级")
    magic_effects: Optional[str] = Field(None, description="魔法特效数据")


class GqScoreController:
    def __init__(self):
        from app.business.gq.score_business import GqScoreBusiness
        self.score_business = GqScoreBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.gq.user_business import GqUserBusiness
        user_business = GqUserBusiness()
        return user_business.verify_token(token)

    def ActionGqScoreSubmitPost(self, request: Request, body: SubmitScoreRequest,
                                 authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.score_business.submit_score(
            user_id=user.get('id'),
            track_id=body.track_id,
            score=body.score,
            max_combo=body.max_combo,
            accuracy=body.accuracy,
            stars=body.stars,
            magic_effects=body.magic_effects or '[]'
        )

    def ActionGqScoreDetailGet(self, request: Request, score_id: int = Query(..., description="成绩ID"),
                                authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.score_business.get_score_detail(score_id)

    def ActionGqScoreUserListGet(self, request: Request, page: int = Query(1), page_size: int = Query(10),
                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.score_business.get_user_scores(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )

    def ActionGqScoreLeaderboardGet(self, request: Request, track_id: int = Query(..., description="曲目ID"),
                                     page: int = Query(1), page_size: int = Query(10),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.score_business.get_track_leaderboard(
            track_id=track_id,
            page=page,
            page_size=page_size
        )

    def ActionGqScoreBestGet(self, request: Request, track_id: int = Query(..., description="曲目ID"),
                              authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.score_business.get_user_best_score(
            user_id=user.get('id'),
            track_id=track_id
        )

    def ActionGqScoreStatsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.score_business.get_user_stats(user.get('id'))
