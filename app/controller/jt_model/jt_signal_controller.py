from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateSignalRequest(BaseModel):
    city_id: int = Field(..., description="城市ID")
    road_id: int = Field(..., description="道路ID")
    position_x: float = Field(..., description="X坐标")
    position_y: float = Field(..., description="Y坐标")
    signal_type: str = Field(..., description="信号灯类型")
    red_duration: int = Field(..., description="红灯时长")
    green_duration: int = Field(..., description="绿灯时长")
    yellow_duration: int = Field(..., description="黄灯时长")


class UpdateSignalRequest(BaseModel):
    signal_id: int = Field(..., description="信号灯ID")
    position_x: Optional[float] = Field(None, description="X坐标")
    position_y: Optional[float] = Field(None, description="Y坐标")
    signal_type: Optional[str] = Field(None, description="信号灯类型")
    red_duration: Optional[int] = Field(None, description="红灯时长")
    green_duration: Optional[int] = Field(None, description="绿灯时长")
    yellow_duration: Optional[int] = Field(None, description="黄灯时长")


class JtSignalController:
    def __init__(self):
        from app.business.jt_model.signal_business import JtSignalBusiness
        from app.business.jt_model.user_business import JtUserBusiness
        self.signal_business = JtSignalBusiness()
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

    def ActionJtSignalListGet(self, request: Request, city_id: int = Query(..., description="城市ID"),
                               authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.signal_business.get_list(
            user_id=user.get('id'),
            city_id=city_id
        )

    def ActionJtSignalCreatePost(self, request: Request, body: CreateSignalRequest,
                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.signal_business.create(
            user_id=user.get('id'),
            city_id=body.city_id,
            road_id=body.road_id,
            position_x=body.position_x,
            position_y=body.position_y,
            signal_type=body.signal_type,
            red_duration=body.red_duration,
            green_duration=body.green_duration,
            yellow_duration=body.yellow_duration
        )

    def ActionJtSignalUpdatePost(self, request: Request, body: UpdateSignalRequest,
                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.position_x is not None:
            data['position_x'] = body.position_x
        if body.position_y is not None:
            data['position_y'] = body.position_y
        if body.signal_type is not None:
            data['signal_type'] = body.signal_type
        if body.red_duration is not None:
            data['red_duration'] = body.red_duration
        if body.green_duration is not None:
            data['green_duration'] = body.green_duration
        if body.yellow_duration is not None:
            data['yellow_duration'] = body.yellow_duration

        return self.signal_business.update(
            user_id=user.get('id'),
            signal_id=body.signal_id,
            data=data
        )

    def ActionJtSignalDeleteDelete(self, request: Request, signal_id: int = Query(..., description="信号灯ID"),
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.signal_business.delete(
            user_id=user.get('id'),
            signal_id=signal_id
        )

    def ActionJtSignalTogglePost(self, request: Request, signal_id: int = Query(..., description="信号灯ID"),
                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.signal_business.toggle(
            user_id=user.get('id'),
            signal_id=signal_id
        )

    def ActionJtSignalSimulatePost(self, request: Request, city_id: int = Query(..., description="城市ID"),
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.signal_business.simulate(
            user_id=user.get('id'),
            city_id=city_id
        )
