from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateRoomRequest(BaseModel):
    room_number: str = Field(..., description="房间号")
    type: str = Field(..., description="房间类型")
    floor: int = Field(..., description="楼层")
    price: float = Field(..., description="价格")
    area: Optional[float] = Field(0, description="面积")
    bed_count: Optional[int] = Field(1, description="床位数")
    max_guests: Optional[int] = Field(2, description="最大入住人数")
    facilities: Optional[List[str]] = Field(None, description="设施列表")
    description: Optional[str] = Field('', description="描述")
    images: Optional[List[str]] = Field(None, description="图片列表")


class UpdateRoomRequest(BaseModel):
    room_number: Optional[str] = Field(None, description="房间号")
    type: Optional[str] = Field(None, description="房间类型")
    floor: Optional[int] = Field(None, description="楼层")
    price: Optional[float] = Field(None, description="价格")
    area: Optional[float] = Field(None, description="面积")
    bed_count: Optional[int] = Field(None, description="床位数")
    max_guests: Optional[int] = Field(None, description="最大入住人数")
    facilities: Optional[List[str]] = Field(None, description="设施列表")
    description: Optional[str] = Field(None, description="描述")
    images: Optional[List[str]] = Field(None, description="图片列表")
    status: Optional[int] = Field(None, description="状态")


class JiudianRoomController:
    def __init__(self):
        from app.business.jiudian_077.user_business import JiudianUserBusiness
        from app.business.jiudian_077.room_business import JiudianRoomBusiness
        self.user_business = JiudianUserBusiness()
        self.room_business = JiudianRoomBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def _is_admin(self, user: dict) -> bool:
        return user and user.get('role') == 'admin'

    def ActionJiudian077RoomListGet(self, request: Request,
                                    page: int = Query(1, description="页码"),
                                    page_size: int = Query(10, description="每页数量"),
                                    type: Optional[str] = Query(None, description="房间类型"),
                                    status: Optional[int] = Query(None, description="状态"),
                                    min_price: Optional[float] = Query(None, description="最低价格"),
                                    max_price: Optional[float] = Query(None, description="最高价格"),
                                    keyword: Optional[str] = Query(None, description="关键词"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取房间列表接口
        GET /api/jiudian_077/room/list/get
        分页获取房间列表，支持筛选
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        query_status = status
        if not self._is_admin(user):
            query_status = 0

        return self.room_business.get_room_list(
            page=page,
            page_size=page_size,
            type=type,
            status=query_status,
            min_price=min_price,
            max_price=max_price,
            keyword=keyword
        )

    def ActionJiudian077RoomAvailableGet(self, request: Request,
                                          page: int = Query(1, description="页码"),
                                          page_size: int = Query(10, description="每页数量"),
                                          type: Optional[str] = Query(None, description="房间类型"),
                                          min_price: Optional[float] = Query(None, description="最低价格"),
                                          max_price: Optional[float] = Query(None, description="最高价格"),
                                          keyword: Optional[str] = Query(None, description="关键词"),
                                          check_in_date: Optional[str] = Query(None, description="入住日期"),
                                          check_out_date: Optional[str] = Query(None, description="退房日期")):
        """
        获取可用房间列表接口
        GET /api/jiudian_077/room/available/get
        获取可预订的房间列表
        """
        return self.room_business.get_available_rooms(
            check_in_date=check_in_date,
            check_out_date=check_out_date,
            page=page,
            page_size=page_size,
            type=type,
            min_price=min_price,
            max_price=max_price,
            keyword=keyword
        )

    def ActionJiudian077RoomDetailGet(self, request: Request,
                                       room_id: int = Query(..., description="房间ID")):
        """
        获取房间详情接口
        GET /api/jiudian_077/room/detail/get
        根据房间ID获取房间详情
        """
        return self.room_business.get_room_by_id(room_id)

    def ActionJiudian077RoomTypesGet(self, request: Request):
        """
        获取房间类型列表接口
        GET /api/jiudian_077/room/types/get
        获取所有房间类型
        """
        return self.room_business.get_room_types()

    def ActionJiudian077RoomStatusListGet(self, request: Request,
                                           authorization: Optional[str] = Header(None)):
        """
        获取房间状态列表接口
        GET /api/jiudian_077/room/status/list/get
        获取所有房间状态（仅管理员）
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not self._is_admin(user):
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.room_business.get_room_status_list()

    def ActionJiudian077RoomCreatePost(self, request: Request, body: CreateRoomRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        创建房间接口
        POST /api/jiudian_077/room/create
        管理员创建新房间
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not self._is_admin(user):
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.room_business.create_room(
            room_number=body.room_number,
            type=body.type,
            floor=body.floor,
            price=body.price,
            area=body.area,
            bed_count=body.bed_count,
            max_guests=body.max_guests,
            facilities=body.facilities,
            description=body.description,
            images=body.images
        )

    def ActionJiudian077RoomUpdatePost(self, request: Request, body: UpdateRoomRequest,
                                        room_id: int = Query(..., description="房间ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        更新房间接口
        POST /api/jiudian_077/room/update
        管理员更新房间信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not self._is_admin(user):
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        data = {}
        if body.room_number is not None:
            data['room_number'] = body.room_number
        if body.type is not None:
            data['type'] = body.type
        if body.floor is not None:
            data['floor'] = body.floor
        if body.price is not None:
            data['price'] = body.price
        if body.area is not None:
            data['area'] = body.area
        if body.bed_count is not None:
            data['bed_count'] = body.bed_count
        if body.max_guests is not None:
            data['max_guests'] = body.max_guests
        if body.facilities is not None:
            data['facilities'] = body.facilities
        if body.description is not None:
            data['description'] = body.description
        if body.images is not None:
            data['images'] = body.images
        if body.status is not None:
            data['status'] = body.status

        return self.room_business.update_room(room_id=room_id, data=data)

    def ActionJiudian077RoomStatusUpdatePost(self, request: Request,
                                              room_id: int = Query(..., description="房间ID"),
                                              status: int = Query(..., description="状态"),
                                              authorization: Optional[str] = Header(None)):
        """
        更新房间状态接口
        POST /api/jiudian_077/room/status/update
        管理员更新房间状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not self._is_admin(user):
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.room_business.update_room_status(room_id=room_id, status=status)

    def ActionJiudian077RoomDeletePost(self, request: Request,
                                        room_id: int = Query(..., description="房间ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        删除房间接口
        POST /api/jiudian_077/room/delete
        管理员删除房间
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not self._is_admin(user):
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.room_business.delete_room(room_id=room_id)
