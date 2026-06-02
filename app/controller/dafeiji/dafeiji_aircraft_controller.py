from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateAircraftRequest(BaseModel):
    name: str = Field(..., description="飞机名称")
    type: Optional[str] = Field(None, description="飞机类型")
    hp: Optional[int] = Field(None, description="生命值")
    attack: Optional[int] = Field(None, description="攻击力")
    speed: Optional[int] = Field(None, description="速度")
    defense: Optional[int] = Field(None, description="防御力")
    bullet_type: Optional[str] = Field(None, description="子弹类型")
    bullet_count: Optional[int] = Field(None, description="子弹数量")
    special_ability: Optional[str] = Field(None, description="特殊能力")
    description: Optional[str] = Field(None, description="描述")


class UpdateAircraftRequest(BaseModel):
    name: Optional[str] = Field(None, description="飞机名称")
    type: Optional[str] = Field(None, description="飞机类型")
    hp: Optional[int] = Field(None, description="生命值")
    attack: Optional[int] = Field(None, description="攻击力")
    speed: Optional[int] = Field(None, description="速度")
    defense: Optional[int] = Field(None, description="防御力")
    bullet_type: Optional[str] = Field(None, description="子弹类型")
    bullet_count: Optional[int] = Field(None, description="子弹数量")
    special_ability: Optional[str] = Field(None, description="特殊能力")
    description: Optional[str] = Field(None, description="描述")


class DafeijiAircraftController:
    def __init__(self):
        from app.business.dafeiji.aircraft_business import DafeijiAircraftBusiness
        from app.business.dafeiji.user_business import DafeijiUserBusiness
        self.aircraft_business = DafeijiAircraftBusiness()
        self.user_business = DafeijiUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionDafeijiAircraftListGet(self, request: Request,
                                     page: int = Query(1, ge=1, description="页码"),
                                     page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                     type: Optional[str] = Query(None, description="飞机类型")):
        return self.aircraft_business.get_list(
            page=page,
            page_size=page_size,
            type_filter=type
        )

    def ActionDafeijiAircraftAllGet(self, request: Request,
                                     type: Optional[str] = Query(None, description="飞机类型")):
        return self.aircraft_business.get_all(type_filter=type)

    def ActionDafeijiAircraftDetailGet(self, request: Request,
                                        aircraft_id: int = Query(..., description="飞机ID")):
        return self.aircraft_business.get_by_id(aircraft_id=aircraft_id)

    def ActionDafeijiAircraftCreatePost(self, request: Request, body: CreateAircraftRequest,
                                         authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        data = {k: v for k, v in body.__dict__.items() if not k.startswith('_') and v is not None}
        return self.aircraft_business.create(data=data)

    def ActionDafeijiAircraftUpdatePost(self, request: Request,
                                         aircraft_id: int = Query(..., description="飞机ID"),
                                         body: UpdateAircraftRequest = None,
                                         authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        data = {k: v for k, v in body.__dict__.items() if not k.startswith('_') and v is not None}
        return self.aircraft_business.update(
            aircraft_id=aircraft_id,
            data=data
        )

    def ActionDafeijiAircraftDeletePost(self, request: Request,
                                         aircraft_id: int = Query(..., description="飞机ID"),
                                         authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.aircraft_business.delete(aircraft_id=aircraft_id)
