from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class FinishRaceRequest(BaseModel):
    track_id: int = Field(..., description="赛道ID")
    car_id: int = Field(..., description="赛车ID")
    finish_time: float = Field(..., description="完成时间(秒)")
    best_lap: float = Field(..., description="最佳单圈时间(秒)")
    rank: int = Field(1, description="排名")
    used_items: Optional[List[dict]] = Field(None, description="使用的道具列表")


class SaicheRaceController:
    def __init__(self):
        from app.business.saiche.race_business import SaicheRaceBusiness
        from app.business.saiche.user_business import SaicheUserBusiness
        self.race_business = SaicheRaceBusiness()
        self.user_business = SaicheUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def _get_current_admin(self, token: str) -> Optional[dict]:
        from app.business.saiche.admin_business import SaicheAdminBusiness
        admin_business = SaicheAdminBusiness()
        return admin_business.verify_token(token)

    def ActionSaicheRaceStartPost(self, request: Request,
                                   track_id: int = Query(..., description="赛道ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        开始比赛接口
        POST /api/saiche/race/start
        开始比赛，获取赛道和赛车信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.race_business.start_race(
            user_id=user.get('id'),
            track_id=track_id
        )

    def ActionSaicheRaceFinishPost(self, request: Request, body: FinishRaceRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        完成比赛接口
        POST /api/saiche/race/finish
        完成比赛，保存记录并发放奖励
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.race_business.finish_race(
            user_id=user.get('id'),
            track_id=body.track_id,
            car_id=body.car_id,
            finish_time=body.finish_time,
            best_lap=body.best_lap,
            rank=body.rank,
            used_items=body.used_items
        )

    def ActionSaicheRaceDetailGet(self, request: Request, record_id: int = Query(..., description="记录ID")):
        """
        获取比赛记录详情接口
        GET /api/saiche/race/detail/get
        根据记录ID获取比赛详情
        """
        return self.race_business.get_race_record(record_id=record_id)

    def ActionSaicheRaceUserListGet(self, request: Request,
                                     page: int = Query(1, ge=1, description="页码"),
                                     page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                     track_id: Optional[int] = Query(None, description="赛道ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取用户比赛记录列表接口
        GET /api/saiche/race/user/list/get
        获取当前登录用户的比赛记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.race_business.get_user_race_records(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            track_id=track_id
        )

    def ActionSaicheRaceUserStatsGet(self, request: Request,
                                      authorization: Optional[str] = Header(None)):
        """
        获取用户比赛统计接口
        GET /api/saiche/race/user/stats/get
        获取当前登录用户的比赛统计数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.race_business.get_user_stats(user_id=user.get('id'))

    def ActionSaicheRaceRankListGet(self, request: Request,
                                     page: int = Query(1, ge=1, description="页码"),
                                     page_size: int = Query(20, ge=1, le=100, description="每页数量")):
        """
        获取排行榜接口
        GET /api/saiche/race/rank/list/get
        获取全服玩家比赛排行榜
        """
        return self.race_business.get_rank_list(page=page, page_size=page_size)

    def ActionSaicheRaceTrackBestRecordsGet(self, request: Request,
                                             track_id: int = Query(..., description="赛道ID"),
                                             limit: int = Query(10, ge=1, le=100, description="数量")):
        """
        获取赛道最佳记录接口
        GET /api/saiche/race/track/best/records/get
        获取指定赛道的最佳记录
        """
        return self.race_business.get_track_best_records(track_id=track_id, limit=limit)

    def ActionSaicheRaceUserBestRecordGet(self, request: Request,
                                           track_id: int = Query(..., description="赛道ID"),
                                           authorization: Optional[str] = Header(None)):
        """
        获取用户在赛道的最佳记录接口
        GET /api/saiche/race/user/best/record/get
        获取当前登录用户在指定赛道的最佳记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.race_business.get_user_best_record(
            user_id=user.get('id'),
            track_id=track_id
        )
