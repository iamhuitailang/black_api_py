from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class SubmitScoreRequest(BaseModel):
    music_id: int = Field(..., description="音乐ID")
    score: int = Field(..., description="原始得分")
    max_combo: int = Field(..., description="最大连击")
    perfect_count: int = Field(..., description="Perfect次数")
    good_count: int = Field(..., description="Good次数")
    miss_count: int = Field(..., description="Miss次数")
    distance: float = Field(..., description="跑过的距离")
    play_time: int = Field(..., description="游戏时长（秒）")


class YpScoreController:
    def __init__(self):
        from app.business.yp.score_business import YpScoreBusiness
        self.score_business = YpScoreBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.yp.user_business import YpUserBusiness
        user_business = YpUserBusiness()
        return user_business.verify_token(token)

    def ActionYpScoreSubmitPost(self, request: Request, body: SubmitScoreRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        提交游戏得分
        POST /api/yp/score/submit
        游戏结束后提交得分
        """
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
            music_id=body.music_id,
            score=body.score,
            max_combo=body.max_combo,
            perfect_count=body.perfect_count,
            good_count=body.good_count,
            miss_count=body.miss_count,
            distance=body.distance,
            play_time=body.play_time
        )

    def ActionYpScoreLeaderboardGet(self, request: Request,
                                     music_id: int = Query(0, description="音乐ID，0为总榜"),
                                     page: int = Query(1, description="页码"),
                                     page_size: int = Query(20, description="每页数量")):
        """
        获取排行榜
        GET /api/yp/score/leaderboard/get
        获取指定音乐或总排行榜
        """
        return self.score_business.get_leaderboard(music_id, page, page_size)

    def ActionYpScoreMyGet(self, request: Request,
                            page: int = Query(1, description="页码"),
                            page_size: int = Query(20, description="每页数量"),
                            authorization: Optional[str] = Header(None)):
        """
        获取我的得分记录
        GET /api/yp/score/my/get
        获取当前用户的得分历史
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.score_business.get_user_scores(user.get('id'), page, page_size)

    def ActionYpScoreRankGet(self, request: Request,
                              music_id: int = Query(0, description="音乐ID，0为总榜"),
                              authorization: Optional[str] = Header(None)):
        """
        获取我的排名
        GET /api/yp/score/rank/get
        获取当前用户在指定音乐或总榜的排名
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.score_business.get_user_rank(user.get('id'), music_id)

    def ActionYpScoreDeletePost(self, request: Request, score_id: int = Query(..., description="得分记录ID")):
        """
        删除得分记录（管理员）
        POST /api/yp/score/delete
        删除指定得分记录
        """
        return self.score_business.delete_score(score_id)
