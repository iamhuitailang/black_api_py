from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class UpdateCityRequest(BaseModel):
    name: Optional[str] = Field(None, description="城市名称")


class JtCityController:
    def __init__(self):
        from app.business.jt_model.city_business import JtCityBusiness
        from app.business.jt_model.user_business import JtUserBusiness
        self.city_business = JtCityBusiness()
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

    def ActionJtCityDetailGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.city_business.get_detail(user_id=user.get('id'))

    def ActionJtCityUpdatePost(self, request: Request, body: UpdateCityRequest,
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
        if body.name is not None:
            data['name'] = body.name

        return self.city_business.update(
            user_id=user.get('id'),
            data=data
        )

    def ActionJtCityUpgradePost(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.city_business.upgrade(user_id=user.get('id'))

    def ActionJtCitySatisfactionRecalculatePost(self, request: Request,
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

        return self.city_business.recalculate_satisfaction(
            user_id=user.get('id'),
            city_id=city_id
        )
