from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateAccidentRequest(BaseModel):
    city_id: int = Field(..., description="城市ID")
    road_id: int = Field(..., description="道路ID")
    accident_type: str = Field(..., description="事故类型")
    severity: int = Field(..., description="严重程度")
    position_x: float = Field(..., description="X坐标")
    position_y: float = Field(..., description="Y坐标")
    description: Optional[str] = Field(None, description="事故描述")


class JtAccidentController:
    def __init__(self):
        from app.business.jt_model.accident_business import JtAccidentBusiness
        from app.business.jt_model.user_business import JtUserBusiness
        self.accident_business = JtAccidentBusiness()
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

    def ActionJtAccidentListGet(self, request: Request, city_id: int = Query(..., description="城市ID"),
                                 status: Optional[str] = Query(None, description="事故状态"),
                                 authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.accident_business.get_list(
            user_id=user.get('id'),
            city_id=city_id,
            status=status
        )

    def ActionJtAccidentCreatePost(self, request: Request, body: CreateAccidentRequest,
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.accident_business.create(
            user_id=user.get('id'),
            city_id=body.city_id,
            road_id=body.road_id,
            accident_type=body.accident_type,
            severity=body.severity,
            position_x=body.position_x,
            position_y=body.position_y,
            description=body.description or ''
        )

    def ActionJtAccidentRespondPost(self, request: Request, accident_id: int = Query(..., description="事故ID"),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.accident_business.respond(
            user_id=user.get('id'),
            accident_id=accident_id
        )

    def ActionJtAccidentResolvePost(self, request: Request, accident_id: int = Query(..., description="事故ID"),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.accident_business.resolve(
            user_id=user.get('id'),
            accident_id=accident_id
        )

    def ActionJtAccidentGeneratePost(self, request: Request, city_id: int = Query(..., description="城市ID"),
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.accident_business.generate(
            user_id=user.get('id'),
            city_id=city_id
        )
