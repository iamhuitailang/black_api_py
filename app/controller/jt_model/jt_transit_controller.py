from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateTransitRequest(BaseModel):
    city_id: int = Field(..., description="城市ID")
    transit_type: str = Field(..., description="公交类型")
    name: str = Field(..., description="线路名称")
    route_data: str = Field(..., description="路线数据")
    capacity: int = Field(..., description="容量")
    frequency: int = Field(..., description="发车频率")
    fare: float = Field(..., description="票价")


class UpdateTransitRequest(BaseModel):
    transit_id: int = Field(..., description="公交ID")
    transit_type: Optional[str] = Field(None, description="公交类型")
    name: Optional[str] = Field(None, description="线路名称")
    route_data: Optional[str] = Field(None, description="路线数据")
    capacity: Optional[int] = Field(None, description="容量")
    frequency: Optional[int] = Field(None, description="发车频率")
    fare: Optional[float] = Field(None, description="票价")


class JtTransitController:
    def __init__(self):
        from app.business.jt_model.transit_business import JtTransitBusiness
        from app.business.jt_model.user_business import JtUserBusiness
        self.transit_business = JtTransitBusiness()
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

    def ActionJtTransitListGet(self, request: Request, city_id: int = Query(..., description="城市ID"),
                                authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.transit_business.get_list(
            user_id=user.get('id'),
            city_id=city_id
        )

    def ActionJtTransitCreatePost(self, request: Request, body: CreateTransitRequest,
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.transit_business.create(
            user_id=user.get('id'),
            city_id=body.city_id,
            transit_type=body.transit_type,
            name=body.name,
            route_data=body.route_data,
            capacity=body.capacity,
            frequency=body.frequency,
            fare=body.fare
        )

    def ActionJtTransitUpdatePost(self, request: Request, body: UpdateTransitRequest,
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
        if body.transit_type is not None:
            data['transit_type'] = body.transit_type
        if body.name is not None:
            data['name'] = body.name
        if body.route_data is not None:
            data['route_data'] = body.route_data
        if body.capacity is not None:
            data['capacity'] = body.capacity
        if body.frequency is not None:
            data['frequency'] = body.frequency
        if body.fare is not None:
            data['fare'] = body.fare

        return self.transit_business.update(
            user_id=user.get('id'),
            transit_id=body.transit_id,
            data=data
        )

    def ActionJtTransitDeleteDelete(self, request: Request, transit_id: int = Query(..., description="公交ID"),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.transit_business.delete(
            user_id=user.get('id'),
            transit_id=transit_id
        )

    def ActionJtTransitSimulatePost(self, request: Request, city_id: int = Query(..., description="城市ID"),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.transit_business.simulate(
            user_id=user.get('id'),
            city_id=city_id
        )
