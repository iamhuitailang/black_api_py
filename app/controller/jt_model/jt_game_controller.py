from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class SaveGameRequest(BaseModel):
    game_data: str = Field(..., description="游戏数据")
    current_music: Optional[str] = Field(None, description="当前音乐")
    game_speed: Optional[float] = Field(None, description="游戏速度")
    day_count: Optional[int] = Field(None, description="天数")
    time_of_day: Optional[float] = Field(None, description="时间")
    is_peak_hour: Optional[bool] = Field(None, description="是否高峰时段")


class AdvanceTimeRequest(BaseModel):
    minutes: int = Field(..., description="推进分钟数")


class JtGameController:
    def __init__(self):
        from app.business.jt_model.game_business import JtGameBusiness
        from app.business.jt_model.user_business import JtUserBusiness
        self.game_business = JtGameBusiness()
        self.user_business = JtUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionJtGameSavePost(self, request: Request, body: SaveGameRequest,
                              authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {
            'game_data': body.game_data
        }
        if body.current_music is not None:
            data['current_music'] = body.current_music
        if body.game_speed is not None:
            data['game_speed'] = body.game_speed
        if body.day_count is not None:
            data['day_count'] = body.day_count
        if body.time_of_day is not None:
            data['time_of_day'] = body.time_of_day
        if body.is_peak_hour is not None:
            data['is_peak_hour'] = body.is_peak_hour

        return self.game_business.save(
            user_id=user.get('id'),
            data=data
        )

    def ActionJtGameLoadGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.load(user_id=user.get('id'))

    def ActionJtGameAdvanceTimePost(self, request: Request, body: AdvanceTimeRequest,
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.advance_time(
            user_id=user.get('id'),
            minutes=body.minutes
        )

    def ActionJtGameTriggerEventPost(self, request: Request, city_id: int = Query(..., description="城市ID"),
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.trigger_event(
            user_id=user.get('id'),
            city_id=city_id
        )

    def ActionJtGameSatisfactionGet(self, request: Request, city_id: int = Query(..., description="城市ID"),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_satisfaction(
            user_id=user.get('id'),
            city_id=city_id
        )

    def ActionJtGameSatisfactionHistoryGet(self, request: Request,
                                            city_id: int = Query(..., description="城市ID"),
                                            period: Optional[str] = Query(None, description="时间段"),
                                            limit: Optional[int] = Query(None, description="数量限制"),
                                            authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_satisfaction_history(
            user_id=user.get('id'),
            city_id=city_id,
            period=period,
            limit=limit
        )

    def ActionJtGameSatisfactionCalculatePost(self, request: Request,
                                               city_id: int = Query(..., description="城市ID"),
                                               authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.calculate_satisfaction(
            user_id=user.get('id'),
            city_id=city_id
        )
