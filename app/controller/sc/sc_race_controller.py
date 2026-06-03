from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class EnterRaceRequest(BaseModel):
    race_id: int = Field(..., description="比赛ID")
    car_id: int = Field(..., description="车辆ID")


class SimulateRaceRequest(BaseModel):
    race_id: int = Field(..., description="比赛ID")


class ScRaceController:
    def __init__(self):
        from app.business.sc.sc_race_business import ScRaceBusiness
        self.race_business = ScRaceBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.sc.sc_user_business import ScUserBusiness
        user_business = ScUserBusiness()
        return user_business.verify_token(token)

    def ActionScRaceUpcomingListGet(self, request: Request, page: int = Query(1, description="页码"),
                                     page_size: int = Query(10, description="每页数量")):
        """
        获取即将开始的比赛列表接口
        GET /api/sc/race/upcoming/list/get
        分页获取即将开始的比赛列表
        """
        return self.race_business.get_upcoming_races(
            page=page,
            page_size=page_size
        )

    def ActionScRaceDetailGet(self, request: Request, race_id: int = Query(..., description="比赛ID")):
        """
        获取比赛详情接口
        GET /api/sc/race/detail/get
        根据比赛ID获取比赛详情、参赛列表和结果
        """
        return self.race_business.get_race_detail(race_id)

    def ActionScRaceEnterPost(self, request: Request, body: EnterRaceRequest,
                               authorization: Optional[str] = Header(None)):
        """
        报名比赛接口
        POST /api/sc/race/enter
        用户使用指定车辆报名比赛
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.race_business.enter_race(
            user_id=user.get('id'),
            race_id=body.race_id,
            car_id=body.car_id
        )

    def ActionScRaceEntryListGet(self, request: Request, race_id: int = Query(..., description="比赛ID")):
        """
        获取比赛参赛列表接口
        GET /api/sc/race/entry/list/get
        获取指定比赛的所有参赛者信息
        """
        return self.race_business.get_race_entries(race_id)

    def ActionScRaceUserListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户参赛列表接口
        GET /api/sc/race/user/list/get
        获取当前用户报名的所有比赛
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.race_business.get_user_races(user_id=user.get('id'))

    def ActionScRaceSimulatePost(self, request: Request, body: SimulateRaceRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        模拟比赛接口
        POST /api/sc/race/simulate
        模拟比赛进行并生成结果，任何人都可调用
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.race_business.simulate_race(race_id=body.race_id)

    def ActionScRaceResultListGet(self, request: Request, race_id: int = Query(..., description="比赛ID")):
        """
        获取比赛结果列表接口
        GET /api/sc/race/result/list/get
        获取指定比赛的最终排名和成绩
        """
        return self.race_business.get_race_results(race_id)

    def ActionScRaceUserResultListGet(self, request: Request, page: int = Query(1, description="页码"),
                                       page_size: int = Query(10, description="每页数量"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取用户比赛结果列表接口
        GET /api/sc/race/user/result/list/get
        分页获取当前用户的所有比赛成绩和统计
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.race_business.get_user_results(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )
