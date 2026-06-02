from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class SubmitScoreRequest(BaseModel):
    song_id: int = Field(..., description="歌曲ID")
    instrument_id: int = Field(..., description="乐器ID")
    difficulty: str = Field(..., description="难度")
    score: int = Field(..., description="分数")
    max_combo: int = Field(..., description="最大连击")
    perfect_count: int = Field(..., description="Perfect数量")
    great_count: int = Field(..., description="Great数量")
    good_count: int = Field(..., description="Good数量")
    miss_count: int = Field(..., description="Miss数量")


class JinwutuanScoreController:
    def __init__(self):
        from app.business.jinwutuan.score_business import JinwutuanScoreBusiness
        from app.business.jinwutuan.user_business import JinwutuanUserBusiness
        self.score_business = JinwutuanScoreBusiness()
        self.user_business = JinwutuanUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionJinwutuanScoreSubmitPost(self, request: Request, body: SubmitScoreRequest,
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
            song_id=body.song_id,
            instrument_id=body.instrument_id,
            difficulty=body.difficulty,
            score=body.score,
            max_combo=body.max_combo,
            perfect_count=body.perfect_count,
            great_count=body.great_count,
            good_count=body.good_count,
            miss_count=body.miss_count
        )

    def ActionJinwutuanScoreLeaderboardGet(self, request: Request,
                                            song_id: int = Query(..., description="歌曲ID"),
                                            difficulty: Optional[str] = Query(None, description="难度"),
                                            instrument_id: Optional[int] = Query(None, description="乐器ID"),
                                            page: int = Query(1, ge=1, description="页码"),
                                            page_size: int = Query(10, ge=1, le=100, description="每页数量")):
        return self.score_business.get_song_leaderboard(
            song_id=song_id,
            difficulty=difficulty,
            instrument_id=instrument_id,
            page=page,
            page_size=page_size
        )

    def ActionJinwutuanScoreUserGet(self, request: Request,
                                     authorization: Optional[str] = Header(None),
                                     page: int = Query(1, ge=1, description="页码"),
                                     page_size: int = Query(10, ge=1, le=100, description="每页数量")):
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

    def ActionJinwutuanScoreBestGet(self, request: Request,
                                     song_id: int = Query(..., description="歌曲ID"),
                                     difficulty: Optional[str] = Query(None, description="难度"),
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
            song_id=song_id,
            difficulty=difficulty
        )
