from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateCompetitionRequest(BaseModel):
    title: str = Field(..., description="竞赛标题")
    description: Optional[str] = Field(None, description="描述")
    track_id: int = Field(..., description="曲目ID")
    start_time: str = Field(..., description="开始时间")
    end_time: str = Field(..., description="结束时间")
    max_participants: Optional[int] = Field(None, description="最大参与人数")
    reward_coins: Optional[int] = Field(None, description="奖励金币")
    reward_gems: Optional[int] = Field(None, description="奖励宝石")
    reward_magic_id: Optional[int] = Field(None, description="奖励魔法特效ID")


class GqCompetitionController:
    def __init__(self):
        from app.business.gq.competition_business import GqCompetitionBusiness
        self.competition_business = GqCompetitionBusiness()

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

    def ActionGqCompetitionListGet(self, request: Request, page: int = Query(1), page_size: int = Query(10),
                                    status: Optional[int] = Query(None),
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.competition_business.get_competition_list(
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionGqCompetitionDetailGet(self, request: Request, competition_id: int = Query(..., description="竞赛ID"),
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.competition_business.get_competition_detail(competition_id)

    def ActionGqCompetitionJoinPost(self, request: Request, body: dict, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        competition_id = body.get('competition_id')
        return self.competition_business.join_competition(user.get('id'), competition_id)

    def ActionGqCompetitionScorePost(self, request: Request, body: dict, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.competition_business.submit_competition_score(
            user_id=user.get('id'),
            competition_id=body.get('competition_id'),
            score=body.get('score'),
            max_combo=body.get('max_combo'),
            accuracy=body.get('accuracy'),
            stars=body.get('stars')
        )

    def ActionGqCompetitionLeaderboardGet(self, request: Request,
                                            competition_id: int = Query(..., description="竞赛ID"),
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

        return self.competition_business.get_competition_leaderboard(
            competition_id=competition_id,
            page=page,
            page_size=page_size
        )

    def ActionGqCompetitionUserListGet(self, request: Request, page: int = Query(1), page_size: int = Query(10),
                                        authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.competition_business.get_user_competitions(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )

    def ActionGqCompetitionCreatePost(self, request: Request, body: CreateCompetitionRequest,
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.competition_business.create_competition(
            title=body.title,
            description=body.description or '',
            track_id=body.track_id,
            start_time=body.start_time,
            end_time=body.end_time,
            max_participants=body.max_participants or 100,
            reward_coins=body.reward_coins or 0,
            reward_gems=body.reward_gems or 0,
            reward_magic_id=body.reward_magic_id or 0
        )

    def ActionGqCompetitionUpdatePost(self, request: Request, body: dict, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        competition_id = body.get('competition_id')
        data = {k: v for k, v in body.items() if k != 'competition_id' and v is not None}
        return self.competition_business.update_competition(competition_id, data)
