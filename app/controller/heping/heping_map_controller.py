from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateMapRequest(BaseModel):
    name: str = Field(..., description="地图名称")
    width: float = Field(..., description="地图宽度")
    height: float = Field(..., description="地图高度")
    terrain_type: str = Field(..., description="地形类型")
    description: Optional[str] = Field(None, description="地图描述")
    thumbnail: Optional[str] = Field(None, description="缩略图")
    safe_zone_speed: Optional[float] = Field(None, description="安全区缩圈速度")
    max_players: Optional[int] = Field(None, description="最大玩家数")


class UpdateMapRequest(BaseModel):
    map_id: int = Field(..., description="地图ID")
    name: Optional[str] = Field(None, description="地图名称")
    width: Optional[float] = Field(None, description="地图宽度")
    height: Optional[float] = Field(None, description="地图高度")
    terrain_type: Optional[str] = Field(None, description="地形类型")
    description: Optional[str] = Field(None, description="地图描述")
    thumbnail: Optional[str] = Field(None, description="缩略图")
    safe_zone_speed: Optional[float] = Field(None, description="安全区缩圈速度")
    max_players: Optional[int] = Field(None, description="最大玩家数")


class DeleteMapRequest(BaseModel):
    map_id: int = Field(..., description="地图ID")


class HepingMapController:
    def __init__(self):
        from app.business.heping.map_business import MapBusiness
        from app.business.heping.admin_business import HepingAdminBusiness
        from app.business.heping.user_business import HepingUserBusiness
        self.map_business = MapBusiness()
        self.admin_business = HepingAdminBusiness()
        self.user_business = HepingUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionHepingMapCreatePost(self, request: Request, body: CreateMapRequest,
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }
        data = {
            'name': body.name,
            'width': body.width,
            'height': body.height,
            'terrain_type': body.terrain_type,
            'description': body.description or '',
            'thumbnail': body.thumbnail or '',
            'safe_zone_speed': body.safe_zone_speed,
            'max_players': body.max_players
        }
        return self.map_business.create_map(**data)

    def ActionHepingMapDetailGet(self, request: Request, map_id: int = Query(..., description="地图ID"),
                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        return self.map_business.get_map(map_id=map_id)

    def ActionHepingMapListGet(self, request: Request,
                                page: int = Query(1, ge=1, description="页码"),
                                page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        return self.map_business.get_map_list(
            page=page,
            page_size=page_size
        )

    def ActionHepingMapUpdatePost(self, request: Request, body: UpdateMapRequest,
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }
        data = {'map_id': body.map_id}
        if body.name is not None:
            data['name'] = body.name
        if body.width is not None:
            data['width'] = body.width
        if body.height is not None:
            data['height'] = body.height
        if body.terrain_type is not None:
            data['terrain_type'] = body.terrain_type
        if body.description is not None:
            data['description'] = body.description
        if body.thumbnail is not None:
            data['thumbnail'] = body.thumbnail
        if body.safe_zone_speed is not None:
            data['safe_zone_speed'] = body.safe_zone_speed
        if body.max_players is not None:
            data['max_players'] = body.max_players
        return self.map_business.update_map(**data)

    def ActionHepingMapDeletePost(self, request: Request, body: DeleteMapRequest,
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }
        return self.map_business.delete_map(map_id=body.map_id)
