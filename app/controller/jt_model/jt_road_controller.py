from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateRoadRequest(BaseModel):
    city_id: int = Field(..., description="城市ID")
    road_type: str = Field(..., description="道路类型")
    name: str = Field(..., description="道路名称")
    start_x: float = Field(..., description="起点X坐标")
    start_y: float = Field(..., description="起点Y坐标")
    end_x: float = Field(..., description="终点X坐标")
    end_y: float = Field(..., description="终点Y坐标")
    lanes: int = Field(..., description="车道数")
    speed_limit: float = Field(..., description="限速")


class UpdateRoadRequest(BaseModel):
    road_id: int = Field(..., description="道路ID")
    road_type: Optional[str] = Field(None, description="道路类型")
    name: Optional[str] = Field(None, description="道路名称")
    start_x: Optional[float] = Field(None, description="起点X坐标")
    start_y: Optional[float] = Field(None, description="起点Y坐标")
    end_x: Optional[float] = Field(None, description="终点X坐标")
    end_y: Optional[float] = Field(None, description="终点Y坐标")
    lanes: Optional[int] = Field(None, description="车道数")
    speed_limit: Optional[float] = Field(None, description="限速")


class JtRoadController:
    def __init__(self):
        from app.business.jt_model.road_business import JtRoadBusiness
        from app.business.jt_model.user_business import JtUserBusiness
        self.road_business = JtRoadBusiness()
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

    def ActionJtRoadListGet(self, request: Request, city_id: int = Query(..., description="城市ID"),
                             authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.road_business.get_list(
            user_id=user.get('id'),
            city_id=city_id
        )

    def ActionJtRoadCreatePost(self, request: Request, body: CreateRoadRequest,
                                authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.road_business.create(
            user_id=user.get('id'),
            city_id=body.city_id,
            road_type=body.road_type,
            name=body.name,
            start_x=body.start_x,
            start_y=body.start_y,
            end_x=body.end_x,
            end_y=body.end_y,
            lanes=body.lanes,
            speed_limit=body.speed_limit
        )

    def ActionJtRoadUpdatePost(self, request: Request, body: UpdateRoadRequest,
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
        if body.road_type is not None:
            data['road_type'] = body.road_type
        if body.name is not None:
            data['name'] = body.name
        if body.start_x is not None:
            data['start_x'] = body.start_x
        if body.start_y is not None:
            data['start_y'] = body.start_y
        if body.end_x is not None:
            data['end_x'] = body.end_x
        if body.end_y is not None:
            data['end_y'] = body.end_y
        if body.lanes is not None:
            data['lanes'] = body.lanes
        if body.speed_limit is not None:
            data['speed_limit'] = body.speed_limit

        return self.road_business.update(
            user_id=user.get('id'),
            road_id=body.road_id,
            data=data
        )

    def ActionJtRoadDeleteDelete(self, request: Request, road_id: int = Query(..., description="道路ID"),
                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.road_business.delete(
            user_id=user.get('id'),
            road_id=road_id
        )

    def ActionJtRoadSimulatePost(self, request: Request, city_id: int = Query(..., description="城市ID"),
                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.road_business.simulate(
            user_id=user.get('id'),
            city_id=city_id
        )
